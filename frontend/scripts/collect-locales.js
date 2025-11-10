#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const generatedFile = path.join(root, 'src', 'shared', 'generated', 'i18n', 'generated_i18n.ts');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function isLocalesFolder(dir) {
  return path.basename(dir) === 'locales';
}

function findLocaleFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (isLocalesFolder(full)) {
        const files = fs.readdirSync(full).filter(f => f.endsWith('.json'));
        for (const f of files) results.push(path.join(full, f));
      } else {
        findLocaleFiles(full, results);
      }
    }
  }
  return results;
}

function inferNamespace(filePath) {
  // Determine namespace based on file name and location.
  // If filename is a language file (e.g. en.json), infer namespace from ancestor feature/shared folder.
  const filename = path.basename(filePath);
  const parts = filePath.split(path.sep);
  const langFileMatch = /^[a-z]{2}(?:-[A-Z]{2})?\.json$/;
  if (langFileMatch.test(filename)) {
    // Get index of the locales directory
    const localesIdx = parts.indexOf('locales');
    if (localesIdx >= 0) {
      // For FSD segments (ui, model, api, lib), use the parent component name
      // Example: /features/app/ui/UserMenu/locales/en.json -> namespace should be UserMenu
      const segments = ['ui', 'model', 'api', 'lib'];
      const segmentIdx = parts.findIndex(part => segments.includes(part));
      
      if (segmentIdx >= 0 && segmentIdx + 1 < localesIdx) {
        // Return the directory name after the segment (ui/UserMenu -> UserMenu)
        return parts[segmentIdx + 1];
      }
      
      // Check for features directory
      const featuresIdx = parts.indexOf('features');
      if (featuresIdx >= 0 && parts.length > featuresIdx + 1) return parts[featuresIdx + 1];
      
      // Check for entities directory
      const entitiesIdx = parts.indexOf('entities');
      if (entitiesIdx >= 0 && parts.length > entitiesIdx + 1) return parts[entitiesIdx + 1];
      
      // otherwise use the parent folder of the 'locales' dir
      const dir = path.dirname(filePath); // .../locales
      const maybe = path.basename(path.dirname(dir)); // parent of locales
      return maybe || 'shared';
    }
  }

  // If filename itself encodes the namespace (e.g. group.json), use that.
  return path.basename(filePath, '.json');

  // If filename itself encodes the namespace (e.g. group.json), use that.
  return path.basename(filePath, '.json');
}

function run() {
  console.log('Collecting component-local locales...');
  const files = findLocaleFiles(srcDir);
  if (!files.length) {
    console.log('No component-local locale files found.');
    return;
  }
  console.log(`Found ${files.length} locale files.`);
  // Prepare structure: lang -> ns -> [filePaths]
  const map = {};
  const nsPathMap = {}; // Mapping of namespaces to the paths they were created from

  for (const file of files) {
    try {
      const lang = path.basename(file, '.json');
      const ns = inferNamespace(file);
      map[lang] = map[lang] || {};
      map[lang][ns] = map[lang][ns] || [];
      map[lang][ns].push(file);
      
      // Добавляем информацию о пути в nsPathMap
      nsPathMap[ns] = nsPathMap[ns] || [];
      if (!nsPathMap[ns].includes(file)) {
        nsPathMap[ns].push(file);
      }
    } catch (err) {
      console.error('Failed to process', file, err.message);
    }
  }

  // Output namespace to path mapping
  // console.log('\nNamespace to path mapping:');
  for (const ns of Object.keys(nsPathMap).sort()) {
    // console.log(`\nNamespace: "${ns}"`);
    for (const file of nsPathMap[ns]) {
      // Show relative path for better readability
      const relativePath = path.relative(root, file);
      // console.log(`  - ${relativePath}`);
    }
  }

  // Generate TypeScript file with imports and an exported object
  ensureDir(path.dirname(generatedFile));
  const imports = [];
  const compositeStatements = [];
  const exportLines = [];

  // helper to create safe variable names
  function safeVar(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
  }

  let importIndex = 0;
  for (const lang of Object.keys(map)) {
    for (const ns of Object.keys(map[lang])) {
      const list = map[lang][ns];
      const varNames = [];
      for (const f of list) {
        importIndex += 1;
        // Use absolute paths with @/ alias instead of relative
        const rel = '@/' + path.relative(path.join(root, 'src'), f).replace(/\\/g, '/');
        const v = safeVar(`${ns}_${lang}_${importIndex}`);
        imports.push(`import ${v} from '${rel}';`);
        varNames.push(v);
      }
      const alias = safeVar(`${ns}_${lang}`);
      if (varNames.length === 1) {
        compositeStatements.push(`const ${alias} = ${varNames[0]};`);
      } else {
        compositeStatements.push(`const ${alias} = Object.assign({}, ${varNames.join(', ')});`);
      }
      exportLines.push({ lang, ns, alias });
    }
  }

  const header = `// THIS FILE IS AUTO-GENERATED BY scripts/collect-locales.js
/* eslint-disable */
// Generated imports for component-local i18n JSON files
`;

  let out = header + '\n';
  out += imports.join('\n') + '\n\n';
  out += compositeStatements.join('\n') + '\n\n';

  // Build export object
  const grouped = {};
  for (const e of exportLines) {
    grouped[e.lang] = grouped[e.lang] || {};
    grouped[e.lang][e.ns] = e.alias;
  }
  out += 'export const generatedI18n: Record<string, Record<string, any>> = {' + '\n';
  for (const lang of Object.keys(grouped)) {
    out += `  '${lang}': {\n`;
    for (const ns of Object.keys(grouped[lang])) {
      out += `    '${ns}': ${grouped[lang][ns]},\n`;
    }
    out += '  },\n';
  }
  out += '};\n\nexport default generatedI18n;\n';

  // Create namespace list: prefer canonical order, then extras
  const canonical = ["common","app","auth","shared","deal","appointment","lead","user","kanban","group"];
  const foundNs = new Set();
  for (const lang of Object.keys(grouped)) {
    for (const ns of Object.keys(grouped[lang])) foundNs.add(ns);
  }
  const extras = Array.from(foundNs).filter(n => !canonical.includes(n)).sort();
  const presentCanonical = canonical.filter(n => foundNs.has(n));
  const finalNs = presentCanonical.concat(extras);
  out += `export const generatedNS = ${JSON.stringify(finalNs, null, 2)};\n`;

  fs.writeFileSync(generatedFile, out, 'utf8');
  console.log(`\nWrote ${path.relative(root, generatedFile)}`);

  // Output summary information about the generated namespaces
  console.log('\nGenerated namespaces:');
  console.log(finalNs.map(ns => `  - ${ns}`).join('\n'));
}

run();
