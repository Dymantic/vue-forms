<template>
  <div>
      <form action="" @submit.prevent="submit">
          <slot name="form-body" :form-data="form.data" :form-errors="form.errors" :waiting="waiting"></slot>
          <div id="vue-form-btn-row" :class="button_row_classes">
            <slot name="form-button-row"></slot>
            <button v-if="!useCustomSubmit" :disabled="waiting" type="submit" :class="button_classes">
                <span v-show="!waiting">{{ buttonText }}</span>
                <div class="spinner flex justify-center items-center" v-show="waiting">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </button>   
          </div>
      </form>
  </div>
</template>

<script>
import Form from "./Form";
import axios from "axios";

export default {
  props: {
    "form-attributes": {
      type: Object,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    "redirects-to": {
      type: String,
      default: ""
    },
    "button-text": {
      type: String,
      default: "Submit"
    },
    "use-custom-submit": {
      type: Boolean,
      default: false
    },
    "button-classes": {
      type: String,
      default: ""
    },
    "button-row-classes": {
      type: String,
      default: ""
    }
  },

  data() {
    return {
      can_update: true,
      original_data: { errors: {}, data: {} },
      waiting: false
    };
  },

  computed: {
    form() {
      return this.can_update ? this.formAttributes : this.original_data;
    },

    button_classes() {
      return this.buttonClasses === ""
        ? "w-48 text-center"
        : this.buttonClasses;
    },

    button_row_classes() {
      return this.buttonRowClasses === ""
        ? "flex justify-end items-center p-4"
        : this.buttonRowClasses;
    }
  },

  mounted() {
    if (!(this.formAttributes instanceof Form)) {
      this.can_update = false;
      this.original_data = new Form(this.formAttributes);
    }
  },

  methods: {
    submit() {
      this.waiting = true;
      axios
        .post(this.url, this.form.data)
        .then(({ data }) => this.onSuccess(data))
        .catch(err => this.onFailure(err))
        .then(() => (this.waiting = false));
    },

    onSuccess(data) {
      if (this.redirectsTo) {
        this.redirect(this.redirectsTo);
      }
      this.$emit("submission-okay", data);
    },

    onFailure(err) {
      if (!err.response) {
        this.$emit("form-error");
        return;
      }

      if (err.response.status === 422) {
        this.form.setValidationErrors(err.response.data.errors);
      }

      this.$emit("submission-failed", { status: err.response.status });
    },

    redirect(url) {
      window.location = url;
    }
  }
};
</script>

<style lang="scss" type="text/css">
.spinner > div {
  width: 1rem;
  height: 1rem;
  margin: 0 8px;
  background-color: currentColor;

  border-radius: 50%;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
}

.spinner > div:after {
  content: "";
  display: block;
  padding-bottom: 100%;
}

.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}

.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}

@keyframes sk-bouncedelay {
  0%,
  80%,
  100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  40% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
</style>
