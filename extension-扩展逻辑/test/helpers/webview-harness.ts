import { JSDOM } from 'jsdom';

export interface HarnessResult {
  dom: JSDOM;
  posted: any[];
  document: Document;
  window: any;
}

export function createHarness(): HarnessResult {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="md-content"></div></body></html>',
    { runScripts: 'dangerously', resources: 'usable' }
  );
  const posted: any[] = [];
  (dom.window as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => posted.push(msg),
    setState: () => {},
    getState: () => undefined,
  });
  return { dom, posted, document: dom.window.document, window: dom.window };
}
