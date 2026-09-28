# PRODUCTION_DEPLOYMENT_REPORT (pointer)

Historical / session notes. **Current deploy docs:**

- [docs/deployment/README.md](docs/deployment/README.md)
- [.github/CI_CD_SETUP.md](.github/CI_CD_SETUP.md)

Matrix: `main` → stage-main `:8080`; `develop` → stage-develop `:8081`; tag `v*` → production `:80`. CI migrates; it does not seed.
