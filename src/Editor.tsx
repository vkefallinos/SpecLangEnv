import {
  FileTabs,
  SandpackStack,
  useActiveCode,
  useSandpack
} from "@codesandbox/sandpack-react";
import MonacoEditor, { Monaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { getLanguageOfFile, registerProviders, spec2ts } from "./utils";

export function Editor() {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const [isReady, setIsReady] = useState<any>({});
  const monacoRef = useRef(null);
  const monaco = monacoRef.current as Monaco;
  const typescriptRef = useRef(null);
  const typescript = typescriptRef.current as any;
  const typescriptWorkerRef = useRef(null);
  const typescriptWorker = typescriptWorkerRef.current as any;
  const tsModelRef = useRef();
  const sourceMapRef = useRef();
  const tsModel = tsModelRef.current;
  const specModelRef = useRef();
  const specModel = specModelRef.current;
  const language = getLanguageOfFile(sandpack.activeFile);
  const tsFile = `file://${sandpack.activeFile}.ts`;
  const [validation, setValidation] = useState([]);
  // const tsProxy = new Proxy(typescript, {
  //   get(obj, key) {
  //     return async (...args: any) => {
  //       // console.log(key, args);
  //       return ;
  //     };
  //   }
  // });
  // console.log(tsFile);
  useEffect(() => {
    if (isReady.monaco) {
      if (sandpack.activeFile.endsWith("spec")) {
        if (!monaco.editor.getModel(tsFile)) {
          console.log("init tsModel");
          const [ts, sourceMap] = spec2ts(code);
          sourceMapRef.current = sourceMap;
          tsModelRef.current = monaco.editor.createModel(
            ts,
            "typescript",
            tsFile
          );
          monaco.editor.create(document.querySelector(".ts-editor"), {
            model: tsModelRef.current
          });
          setIsReady((isReady) => ({ ...isReady, tsModel: true }));
          if (!typescript) {
            function worker2(...uris1) {
              async function getTypeScriptWorker(...uris2) {
                const tsWCall = await monaco.languages.typescript.getTypeScriptWorker(
                  ...uris2
                );
                const tsW = await tsWCall(...uris2);
                // return tsW;
                console.log(tsW);
                const tsProxy = new Proxy(tsW, {
                  get(obj, key) {
                    const specModel = specModelRef.current;
                    const tsModel = tsModelRef.current;
                    if (key === "then") {
                      return tsProxy;
                      throw new Error("Waiting for promise instead of worker");
                    }
                    if (typeof tsW[key] === "function") {
                      return async (...args) => {
                        if (args[0].endsWith(".spec")) {
                          args[0] = `${args[0]}.ts`;
                          if (typeof args[1] === "number") {
                            let start = args[1];

                            args[1] = sourceMapRef.current[start];
                          }
                        }
                        console.log("call", key, args);

                        const result = tsW[key](...args);
                        return result;
                      };
                    }
                    return tsW[key];
                  }
                });
                return Promise.resolve(tsProxy);
              }
              return getTypeScriptWorker(...uris1);
            }

            typescriptWorkerRef.current = worker2;
            monaco.languages.typescript.getTypeScriptWorker().then((w) => {
              w().then(async (r) => {
                typescriptRef.current = r;
                // typescriptWorkerRef.current = () => r;

                console.log("init typescript");
                setIsReady((isReady) => ({ ...isReady, typescript: true }));
              });
            });
          }
        }
      }
    }
  }, [isReady.monaco, sandpack.activeFile, tsFile]);
  useEffect(() => {
    async function run() {
      const baseLang = await monaco.languages
        .getLanguages()
        .find((p) => p.id === "scss")
        .loader();
      // here is the monaco instance
      // do something before editor is mounted
      // const lang = merge(customTokenizer, baseLang.language);
      const lang = baseLang.language;
      monaco.languages.register({
        id: "spec",
        extensions: [".spec"],
        aliases: ["Spec", "sass", "scss"],
        mimetypes: ["text/x-spec", "text/spec"]
      });

      monaco.languages.setMonarchTokensProvider("spec", lang);
    }
    if (isReady.monaco) {
      run();
    }
  }, [isReady.monaco]);
  useEffect(() => {
    async function run() {
      if (isReady.typescript) {
        registerProviders(
          typescriptWorkerRef.current,
          {},
          "spec",
          monaco.languages
        );
      }
    }
    run();
  }, [isReady.typescript]);
  useEffect(() => {
    console.log("isReady", isReady);
    async function run() {
      if (isReady.tsModel && isReady.specModel && isReady.typescript) {
        tsModel.setValue(spec2ts(code));
        const suggestions = await typescript.getSuggestionDiagnostics(tsFile);
        const semantic = await typescript.getSemanticDiagnostics(tsFile);
        const syntactic = await typescript.getSyntacticDiagnostics(tsFile);
        const compiler = await typescript.getCompilerOptionsDiagnostics(tsFile);
        const messages = suggestions.concat(
          semantic.concat(syntactic.concat(compiler))
        );
        setValidation(
          messages.map((d) => d.messageText.messageText || d.messageText)
        );
      }
    }
    run();
  }, [isReady.tsModel, isReady.specModel, isReady.typescript, code, tsFile]);
  // console.log(sandpack.activeFile, monacoRef);
  return (
    <SandpackStack style={{ flex: "1", height: "100%", margin: 0 }}>
      <FileTabs />
      <div style={{ height: "200px" }}>
        {validation.map((v, idx) => (
          <div key={idx}>{v}</div>
        ))}
      </div>

      <MonacoEditor
        width="100%"
        height="100vh"
        language={language}
        theme="vs-dark"
        path={sandpack.activeFile}
        beforeMount={(monaco) => {
          if (!isReady.monaco) {
            monacoRef.current = monaco;
            console.log("init monaco");
            setIsReady((isReady) => ({ ...isReady, monaco: true }));
          }
        }}
        onMount={(editor) => {
          console.log("init specModel");
          specModelRef.current = editor.getModel();
          setIsReady((isReady) => ({ ...isReady, specModel: true }));
        }}
        defaultValue={code}
        onChange={(value) => updateCode(value || "")}
        options={{
          // quickSuggestions: {
          //   other: false,
          //   comments: false,
          //   strings: false
          // },
          // parameterHints: {
          //   enabled: false
          // },
          // suggestOnTriggerCharacters: false,
          // acceptSuggestionOnEnter: "off",
          // tabCompletion: "off",
          wordBasedSuggestions: false
        }}
      />
    </SandpackStack>
  );
}
