"use client";
import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useRouter, usePathname } from "next/navigation";

export const LanguageSwitcher: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Determine current language from first path segment (default 'de')
  const segments = (pathname || "/").split("/").filter(Boolean);
  const first = segments[0];
  const currentLang = first === "en" || first === "de" ? first : "de";

  const switchLanguage = (lang: string) => {
    console.log(`Switching language to ${lang}`);

    const current = pathname || "/";
    const segs = current.split("/").filter(Boolean);
    const base = segs[0] === "en" || segs[0] === "de" ? segs.slice(1) : segs; // path without locale
    const suffix = "/" + base.join("/");
    const normalized = suffix === "/" ? "/" : suffix.replace(/\/+$/, "");

    const target = normalized === "/" ? `/${lang}` : `/${lang}${normalized.replace(/\/+$/, "")}`;
    // const target =
    //   lang === "de"
    //     ? normalized
    //     : normalized === "/"
    //       ? "/en"
    //       : "/en" + normalized;

    if (process.env.NODE_ENV !== "production") {
      console.log("[lang-switch]", { from: current, to: target, lang, normalized });
    }
    if (target !== pathname) {
      router.replace(target); // avoid piling history entries
    }
    handleClose();
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={handleClick}
        startIcon={<LanguageIcon />}
      >
        {currentLang.toUpperCase()}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => switchLanguage("de")}
          selected={currentLang === "de"}
        >
          Deutsch
        </MenuItem>
        <MenuItem
          onClick={() => switchLanguage("en")}
          selected={currentLang === "en"}
        >
          English
        </MenuItem>
      </Menu>
    </>
  );
};
