import { assert } from "chai";
import { mount } from "@vue/test-utils";
import sinon from "sinon";
import moxios from "moxios";
import VueForm from "../src/VueForm";
import Form from "../src/Form";

describe("a vue form component", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("the form url is passed as a prop", () => {
    let form_object = new Form({ name: "Testy" });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });

    assert.equal("/test/form/url", form_component.vm.url);
  });

  it("can be passed a Form instance as a form-model prop", () => {
    let form_object = new Form({ name: "Testy" });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });
    assert.isTrue(form_component.vm.form instanceof Form);
  });

  it("reflects form model prop updates", () => {
    let form_object = new Form({ name: "Testy" });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });

    form_object.resetFields({ name: "Updated name" });

    assert.equal("Updated name", form_component.vm.form.data.name);
  });

  it("submits the form via axios", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });

    submitForm(form_component);

    moxios.wait(() => {
      let request = moxios.requests.mostRecent();
      assert.equal("/test/form/url", request.config.url);
      assert.deepEqual(
        JSON.stringify({ name: "Testy", age: 88 }),
        request.config.data
      );
      done();
    });
  });

  it("emits a submission-okay event if submission is successful", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });

    moxios.stubRequest("/test/form/url", {
      status: 200,
      response: { name: "Stored test name", age: 77 }
    });

    submitForm(form_component);

    moxios.wait(() => {
      const event = form_component.emitted()["submission-okay"];
      assert.exists(event);
      assert.deepEqual({ name: "Stored test name", age: 77 }, event[0][0]);
      done();
    });
  });

  it("sets the validation errors if the form validation fails", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });

    moxios.stubRequest("/test/form/url", {
      status: 422,
      response: { errors: { name: ["Invalid name"], age: ["Invalid age"] } }
    });

    submitForm(form_component);

    moxios.wait(() => {
      assert.equal("Invalid name", form_component.vm.form.errors.name);
      assert.equal("Invalid age", form_component.vm.form.errors.age);
      done();
    });
  });

  it("emits a submission failed for a non-validation request error", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url"
      }
    });

    moxios.stubRequest("/test/form/url", {
      status: 500
    });

    submitForm(form_component);

    moxios.wait(() => {
      const event = form_component.emitted()["submission-failed"];
      assert.exists(event);
      assert.deepEqual({ status: 500 }, event[0][0]);
      done();
    });
  });

  it("redirects on successfull submission if redirects-to prop is given", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url",
        redirectsTo: "/test/redirect/url"
      }
    });

    form_component.vm.redirect = sinon.spy();

    moxios.stubRequest("/test/form/url", { status: 200 });

    submitForm(form_component);

    moxios.wait(() => {
      assert.isTrue(
        form_component.vm.redirect.calledWith("/test/redirect/url")
      );
      done();
    });
  });

  it("makes the form data available in the default slot", () => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url",
        redirectsTo: "/test/redirect/url"
      },
      scopedSlots: {
        default: "<div id='test-slot'>{{ props.formData.name }}</div>"
      }
    });

    assert.isTrue(
      form_component.find("#test-slot").element.innerHTML === "Testy"
    );
  });

  it("makes the form errors available in the default slot", () => {
    let form_object = new Form({ name: "Testy", age: 88 });
    form_object.setValidationErrors({ name: ["Test Error"] });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url",
        redirectsTo: "/test/redirect/url"
      },
      scopedSlots: {
        default: "<div id='test-slot'>{{ props.formErrors.name }}</div>"
      }
    });

    assert.isTrue(
      form_component.find("#test-slot").element.innerHTML === "Test Error"
    );
  });

  it("makes the waiting status available in the default slot", () => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formModel: form_object,
        url: "/test/form/url",
        redirectsTo: "/test/redirect/url"
      },
      scopedSlots: {
        default:
          "<div id='test-slot'>{{ props.waiting ? 'Test Waiting True' : 'Test Waiting False' }}</div>"
      }
    });
    form_component.setData({ waiting: true });

    assert.isTrue(
      form_component.find("#test-slot").element.innerHTML ===
        "Test Waiting True"
    );

    form_component.setData({ waiting: false });

    assert.isTrue(
      form_component.find("#test-slot").element.innerHTML ===
        "Test Waiting False"
    );
  });

  function submitForm(form_component) {
    let form = form_component.find("form");
    form.trigger("submit");
  }
});
