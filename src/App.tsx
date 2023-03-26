import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackFileExplorer
} from "@codesandbox/sandpack-react";

import { Editor } from "./Editor";

const App = () => {
  return (
    <SandpackProvider
      template="vanilla"
      files={{
        "/ypdil.spec": {
          code: `
$CAPTION: Υπεύθυνη Δήλωση;
$DEFAULT_MODE_LANG: default/el;
$INTRO_TEXT: 'Με ατομική μου ευθύνη και γνωρίζοντας τις κυρώσεις<sup>(2)</sup>,';

.common_step_props {
  .display {
    captionLeft: $CAPTION;
  }
}

.TemplateType[type] {
  .steps {
    * {
      action-order: #string;
    }
  }
  steps-order: #string;
}

:export .Ypdil[TemplateType] {

  .steps {
    .personal {
      @include common.DECL_PERSONAL_INFO_FIELDS;
      @include common.DECL_CONTACT_INFO_FIELDS;
      @include common.SOLEMN_ACTIONS.update;
      @include .common_step_props;
      fieldset-order: personal address contact;
      
      action-order: update;
      .display {
        title: Στοιχεία Δηλούντος;
      }
    }
    .body {
      @include common.BODY;
      .fieldsets {
        .default {
          .introduction {
            value: $INTRO_TEXT;
            .display {
              .default {
                @include components.string;
              }
              .pdf {
                title: Something;
              }
            }
          }
          .free_text {
            user-input-mode: required;
            .display {
              component: text;
              .params {
                format: text;
              }
            }
          }
        }
      }
    }
  }
  steps-order: personal body;
} `
        }
      }}
      options={{
        visibleFiles: ["/index.html", "/ypdil.spec"],
        activeFile: "/ypdil.spec"
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer />
        <Editor />
        <div className="ts-editor" style={{ width: "200px" }} />

        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
          showNavigator={true}
          style={{ flex: "1" }}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default App;
