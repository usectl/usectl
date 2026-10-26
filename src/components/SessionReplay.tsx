"use client";

import { useEffect } from "react";
import { tracker } from "@openreplay/tracker";

// Session replay for the landing (OpenReplay, self-hosted at analytics.usectl.com, project
// "landing"). Only on usectl.com itself — the same deployment also answers on other hosts.
//
// Typed values (the subscribe box) are never recorded; no request bodies or headers; canvas
// animation is not recorded (heavy, and the DOM around it is enough to see what people do).
//
// Signup hand-off: a click on any link to manager.usectl.com gets `lsid=<this session id>`, so
// the dashboard can tag the visitor's first session with the landing session it came from.

const HOSTS = new Set(["usectl.com", "www.usectl.com"]);
const PROJECT_KEY = "DfkHZqqNNpgulYasVwNQ";
const INGEST_POINT = "https://analytics.usectl.com/ingest";
const MANAGER_HOST = "manager.usectl.com";

let started = false;

function tagSignupLinks(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  const sessionID = tracker.getSessionID();
  if (!link || !sessionID) return;
  try {
    const url = new URL(link.href);
    if (url.hostname !== MANAGER_HOST) return;
    url.searchParams.set("lsid", sessionID);
    link.href = url.toString();
  } catch {
    /* not a URL we can rewrite */
  }
}

export function SessionReplay() {
  useEffect(() => {
    if (started || !HOSTS.has(window.location.hostname)) return;
    started = true;
    tracker.configure({
      projectKey: PROJECT_KEY,
      ingestPoint: INGEST_POINT,
      respectDoNotTrack: true,
      captureIFrames: false,
      consoleMethods: ["error"],
      defaultInputMode: 2,
      obscureInputEmails: true,
      obscureTextEmails: true,
      network: { capturePayload: false, ignoreHeaders: true, sessionTokenHeader: false, failuresOnly: false, captureInIframes: false },
      canvas: { disableCanvas: true },
    });
    tracker.start().catch(() => {
      /* ingest unreachable or blocked — never break the page */
    });
    document.addEventListener("click", tagSignupLinks, true);
    return () => document.removeEventListener("click", tagSignupLinks, true);
  }, []);

  return null;
}
