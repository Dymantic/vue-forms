import axios from "axios";

export default {
  props: {
    "form-attributes": {
      type: Object,
      required: false,
      default() {
        return {};
      }
    },
    url: {
      required: true,
      type: String
    },
    "form-type": {
      type: String,
      default: "create"
    },
    "button-text": {
      type: String,
      default: "Submit"
    }
  },

  data() {
    return {
      modalOpen: false,
      waiting: false,
      mainError: ""
    };
  },

  methods: {
    submit() {
      this.clearErrors();

      if (this.canSubmit()) {
        this.postData(this.form.data);
      }
    },

    postData(data) {
      this.waiting = true;

      axios
        .post(this.url, data)
        .then(({ data }) => this.onSuccess(data))
        .catch(({ response }) => this.onFailure(response))
        .then(() => (this.waiting = false));
    },

    onSuccess(data) {
      const parsed_data = this.parseResponseData(data);
      this.modalOpen = false;

      this.formType === "create"
        ? this.form.resetFields()
        : this.form.resetFields(parsed_data);

      this.$emit(`${this.formType}-submitted`, parsed_data);
    },

    onFailure(error_response) {
      if (error_response.status === 422) {
        this.form.setValidationErrors(error_response.data.errors);
        return this.$emit("invalid-submission");
      }

      this.mainError =
        "Unable to submit form. Please refresh and try again later.";
      this.$emit("failed-submission");
    },

    clearErrors() {
      this.form.clearErrors();
    }
  }
};
