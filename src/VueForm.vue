<template>
  <div>
      <form action="" @submit.prevent="submit">
          <slot :form-data="form.data" :form-errors="form.errors" :waiting="waiting"></slot>
      </form>
  </div>
</template>

<script>
import Form from "./Form";
import axios from "axios";

export default {
  props: {
    formModel: {
      type: Form,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    "redirects-to": {
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
      return this.can_update ? this.formModel : this.original_data;
    }
  },

  mounted() {},

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

