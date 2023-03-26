import TemplateType from "types.TemplateType";
import common from "fetch:dilosi.templates.solemn.common";
import components from "fetch:dilosi.templates.common.components";

const $CAPTION = `Υπεύθυνη Δήλωση`;
const $DEFAULT_MODE_LANG = `default/el`;
const $INTRO_TEXT = `'Με ατομική μου ευθύνη και γνωρίζοντας τις κυρώσεις<sup>(2)</sup>,'`;

const common_step_props = {
  display: {
    captionLeft: $CAPTION
  }
};

interface TemplateType {
  steps: {
    [x: string]: {
      "action-order": "string";
    };
  };
}

export const Ypdil: TemplateType = {
  steps: {
    personal: {
      ...common.DECL_PERSONAL_INFO_FIELDS,
      ...common.DECL_CONTACT_INFO_FIELDS,
      ...common.SOLEMN_ACTIONS.update,
      ...common_step_props,
      "fieldset-order": "personal address contact",

      "action-order": "update",
      display: {
        title: "Στοιχεία Δηλούντος"
      }
    },
    body: {
      ...common.BODY,
      fieldsets: {
        default: {
          introduction: {
            value: $INTRO_TEXT,
            display: {
              default: {
                ...components.string
              },
              pdf: {
                title: "Something"
              }
            }
          },
          free_text: {
            "user-input-mode": "required",
            display: {
              component: "text",
              params: {
                format: "text"
              }
            }
          }
        }
      }
    }
  },
  "steps-order": "personal body"
};
