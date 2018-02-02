import { assert } from "chai";
import { mount } from "vue-test-utils";
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

  it("needs a url props to be passed to it", () => {
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: {
          name: "Testy"
        },
        url: "/test/form/url"
      }
    });

    assert.equal("/test/form/url", form_component.vm.url);
  });

  it("accepts the form attributes prop as a json object", () => {
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: {
          name: "Testy"
        }
      }
    });

    assert.equal("Testy", form_component.vm.form.data.name);
  });

  it("can not be updated if the form attributes prop is not a Form instance", () => {
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: {
          name: "Testy"
        }
      }
    });

    form_component.setProps({ formAttributes: { name: "Updated name" } });

    assert.equal("Testy", form_component.vm.form.data.name);
  });

  it("respects form atrributes prop updates if Form object is used", () => {
    let form_object = new Form({ name: "Testy" });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object
      }
    });

    form_object.resetFields({ name: "Updated name" });

    assert.equal("Updated name", form_component.vm.form.data.name);
  });

  it("submits the form via axios if the submit button is clicked", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
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
        formAttributes: form_object,
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
        formAttributes: form_object,
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
        formAttributes: form_object,
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

  it("shows the waiting button durin submission request", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
        url: "/test/form/url"
      }
    });

    submitForm(form_component);

    moxios.wait(() => {
      const spinner = form_component.find(".spinner");
      assert.notEqual("none", spinner.element.style.display);
      done();
    });
  });

  it("has a disabled submit button when waiting on request", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
        url: "/test/form/url"
      }
    });

    submitForm(form_component);

    moxios.wait(() => {
      const button = form_component.find("form button[type=submit]");
      assert.isTrue(button.element.disabled);
      done();
    });
  });

  it("redirects on successfull submission if redirects-to prop is given", done => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
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

  it("can have the submit button text be replaced using an optional prop", () => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
        url: "/test/form/url",
        buttonText: "Test button text"
      }
    });

    assert.equal(
      "Test button text",
      form_component.find("form button[type=submit] > span").element.innerHTML
    );
  });

  it("allows a user to specify the class names for the submit button", () => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
        url: "/test/form/url",
        buttonText: "Test button text",
        buttonClasses: "test-btn-class-1 test-btn-class-2"
      }
    });

    const btn = form_component.find("form button[type=submit]");
    assert.isTrue(btn.element.classList.contains("test-btn-class-1"));
    assert.isTrue(btn.element.classList.contains("test-btn-class-2"));
  });

  it("allows the user to specify the class names for the button row", () => {
    let form_object = new Form({ name: "Testy", age: 88 });
    let form_component = mount(VueForm, {
      propsData: {
        formAttributes: form_object,
        url: "/test/form/url",
        buttonText: "Test button text",
        buttonRowClasses: "test-btn-row-class-1 test-btn-row-class-2"
      }
    });

    const btn_row = form_component.find("form #vue-form-btn-row");
    assert.isTrue(btn_row.element.classList.contains("test-btn-row-class-1"));
    assert.isTrue(btn_row.element.classList.contains("test-btn-row-class-2"));
  });

  function submitForm(form_component) {
    let button = form_component.find("form");
    button.trigger("submit");
  }
});
