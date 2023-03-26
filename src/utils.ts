import * as languageFeatures from "./languageFeatures";
import { typescriptDefaults } from "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import { SourceMapGenerator, SourceMapConsumer } from "source-map";
export const getLanguageOfFile = (filePath: string) => {
  const extensionDotIndex = filePath.lastIndexOf(".");
  const extension = filePath.slice(extensionDotIndex + 1);

  switch (extension) {
    case "spec":
      return "spec";
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return "javascript";
    case "vue":
    case "html":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    default:
      return "javascript";
  }
};
const lexical = [
  {
    find: /(@use ('.*?') as ([a-z]*);)/g,
    replace: "import $2 from $1;",
    type: "import"
  },
  {
    find: /^(\$.*?): (.+);/g,
    replace: "const $1 = `$2`;",
    type: "var declaration"
  },
  {
    find: /^:export \.(.*?)\[type\] {/g,
    replace: "export interface $1 {",
    type: "export interface"
  },
  {
    find: /^\.(.*?)\[type\] {/g,
    replace: "interface $1 {",
    type: "interface declaration"
  },
  {
    find: /^:export \.(.*?) {/g,
    replace: "export const $1 = {",
    type: "export var      "
  },
  {
    find: /^\.(.*?) {/g,
    replace: "const $1 = {",
    type: "object declaration"
  },
  {
    find: /\.(.*?) {/g,
    replace: "'$1': {",
    type: "key object"
  },
  {
    find: /([ ]*)(.*?): (\$.*?);/g,
    replace: "$1'$2': $3,",
    type: "var value"
  },
  {
    find: /([ ]*)(.*?): (.*?);/g,
    replace: "$1'$2': '$3',",
    type: "key value"
  },
  {
    find: /\[(.*?)\]/g,
    replace: ": $1",
    type: "type"
  },
  {
    find: /@include (.*?);/g,
    replace: "...$1,",
    type: "merge"
  },
  {
    find: /([ ]+})/g,
    replace: "$1,",
    type: "inner bracket comma"
  },
  {
    find: /\.\.\.\./g,
    replace: "...",
    type: "fix 4dots"
  },
  {
    find: /\* {/g,
    replace: "[x:string]: {",
    type: "glob type"
  },
  {
    find: /'#(.*?)'/g,
    replace: "$1",
    type: "fix types"
  }
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function transformLine(regex, replace, line) {
  const match = regex.exec(line).slice(1);
  const origMatchesPositions = match.map((str) => {
    const startIndex = line.match(new RegExp(escapeRegExp(str))).index;
    const map = {};
    // str.split("").forEach((_, index) => {
    //   map[startIndex + index] = null;
    // });
    return {
      map,
      text: str,
      originalColumn: startIndex
    };
  });

  const transformedLine = line.replace(regex, replace);

  const positions = origMatchesPositions.map(({ text, map, ...m }) => {
    const transformedColumn = transformedLine.match(
      new RegExp(escapeRegExp(text))
    ).index;
    // text.split("").forEach((_, index) => {});
    return {
      ...m,
      map,
      text,
      transformedColumn
    };
  });
  const sm = positions.reduce((map, trans) => {
    for (
      let index = trans.originalColumn;
      index < trans.originalColumn + trans.text.length;
      index++
    ) {
      map[index] = trans.transformedColumn + (index - trans.originalColumn);
    }
    map.origLength = line.length;
    map.transLength = transformedLine.length;
    return map;
  }, {});
  return [transformedLine, sm];
}

export function spec2ts(specText: string) {
  const sourceMap: any = {};
  let lastOrigIndex = 0;
  let lastTransIndex = 0;
  const ts = specText
    .split("\n")
    .map((line) => {
      const matchReplacer = lexical.find(({ find }) => {
        const match = line.match(find);
        return match;
      });
      if (matchReplacer) {
        const [newLine, sm] = transformLine(
          matchReplacer?.find,
          matchReplacer?.replace,
          line
        );
        for (let pos in sm) {
          pos = parseInt(pos);
          sourceMap[pos + lastOrigIndex] = sm[pos] + lastTransIndex;
        }
        lastOrigIndex += sm.origLength;
        lastTransIndex += sm.transLength;
        // sourceMap.push(sm);

        return newLine;
      }
      return line;
    })
    .join("\n");
  console.log(sourceMap);
  return [ts, sourceMap];
}
export const libFileSet: Record<string, boolean> = {};
libFileSet["lib.d.ts"] = true;

export function registerProviders(
  worker: any,
  modeConfiguration: any,
  modeId: string,
  languages: any
): void {
  const providers = [];
  const libFiles = new languageFeatures.LibFiles(worker);

  languages.registerCompletionItemProvider(
    modeId,
    new languageFeatures.SuggestAdapter(worker)
  );
  languages.registerSignatureHelpProvider(
    modeId,
    new languageFeatures.SignatureHelpAdapter(worker)
  );
  languages.registerHoverProvider(
    modeId,
    new languageFeatures.QuickInfoAdapter(worker)
  );
  languages.registerDocumentHighlightProvider(
    modeId,
    new languageFeatures.DocumentHighlightAdapter(worker)
  );
  languages.registerDefinitionProvider(
    modeId,
    new languageFeatures.DefinitionAdapter(libFiles, worker)
  );
  languages.registerReferenceProvider(
    modeId,
    new languageFeatures.ReferenceAdapter(libFiles, worker)
  );

  languages.registerDocumentSymbolProvider(
    modeId,
    new languageFeatures.OutlineAdapter(worker)
  );
  languages.registerRenameProvider(
    modeId,
    new languageFeatures.RenameAdapter(libFiles, worker)
  );
  languages.registerDocumentRangeFormattingEditProvider(
    modeId,
    new languageFeatures.FormatAdapter(worker)
  );
  languages.registerOnTypeFormattingEditProvider(
    modeId,
    new languageFeatures.FormatOnTypeAdapter(worker)
  );
  languages.registerCodeActionProvider(
    modeId,
    new languageFeatures.CodeActionAdaptor(worker)
  );
  languages.registerInlayHintsProvider(
    modeId,
    new languageFeatures.InlayHintsAdapter(worker)
  );
  new languageFeatures.DiagnosticsAdapter(
    libFiles,
    typescriptDefaults,
    modeId,
    worker
  );
}
