import '../util.js';

import {html} from 'lit';
import type {ReactiveController} from 'lit';
import * as assert from 'uvu/assert';
import {FormController, type FormControllerOptions} from '../../main.js';
import type {TestElement} from '../util.js';

/**
 * Creates a form controller fixture
 * @param {*} value Initial value
 * @param {FormControllerOptions} options Options for the controller
 * @return {Promise}
 */
async function fixture<T extends object>(
  value: T,
  options: FormControllerOptions
): Promise<{
  element: TestElement;
  controller: FormController<T>;
}> {
  const element = document.createElement('test-element') as TestElement;
  const controller = new FormController<T>(element, value, options);
  element.controllers.push(controller as ReactiveController);
  element.template = () => html`
    <div id="value">${JSON.stringify(value)}</div>
    <form ${controller.attach()}>
    </form>
  `;
  document.body.appendChild(element);
  await element.updateComplete;

  return {
    element,
    controller
  };
}

suite('FormController', () => {
  let element: TestElement;

  teardown(() => {
    element.remove();
  });

  suite('default', () => {
    let value: {email?: string};
    let controller: FormController<typeof value>;

    setup(async () => {
      value = {};

      const fixtureResult = await fixture<typeof value>(value, {});
      element = fixtureResult.element;
      controller = fixtureResult.controller;

      element.template = () => html`
        <div id="value">${JSON.stringify(value)}</div>
        <form ${controller.attach()}>
          <input
            type="string"
            name="email"
            @change=${controller.onChange}
            @input=${controller.onInput}
            @blur=${controller.onBlur}
            .value=${controller.value.email ?? ''}>
        </form>
      `;
      await element.updateComplete;
    });

    test('initialises correctly', () => {
      const valueText =
        element.shadowRoot!.querySelector<HTMLDivElement>('#value')!;
      const input = element.shadowRoot!.querySelector<HTMLInputElement>(
        'input[name="email"]'
      )!;
      const form = element.shadowRoot!.querySelector<HTMLFormElement>('form')!;

      assert.is(valueText.textContent, JSON.stringify({}));
      assert.is(input.value, '');
      assert.is(controller.form, form);
      assert.is(controller.errors.size, 0);
      assert.is(controller.value, value);
    });

    test('reacts to change events', async () => {
      const input = element.shadowRoot!.querySelector<HTMLInputElement>(
        'input[name="email"]'
      )!;

      input.value = 'foo';
      input.dispatchEvent(new Event('change'));
      await element.updateComplete;

      const valueText =
        element.shadowRoot!.querySelector<HTMLDivElement>('#value')!;

      assert.is(valueText.textContent, JSON.stringify({email: 'foo'}));
      assert.equal(controller.value, {email: 'foo'});
      assert.is(controller.value, value);
    });

    test('reacts to input events', async () => {
      const input = element.shadowRoot!.querySelector<HTMLInputElement>(
        'input[name="email"]'
      )!;

      input.value = 'foo';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      const valueText =
        element.shadowRoot!.querySelector<HTMLDivElement>('#value')!;

      assert.is(valueText.textContent, JSON.stringify({email: 'foo'}));
      assert.equal(controller.value, {email: 'foo'});
      assert.is(controller.value, value);
    });
  });

  suite('deep paths', () => {
    let value: {deep?: {path?: string}};
    let controller: FormController<typeof value>;

    setup(async () => {
      value = {};

      const fixtureResult = await fixture<typeof value>(value, {});
      element = fixtureResult.element;
      controller = fixtureResult.controller;

      element.template = () => html`
        <div id="value">${JSON.stringify(value)}</div>
        <form ${controller.attach()}>
          <input
            type="string"
            name="deep.path"
            @change=${controller.onChange}
            @input=${controller.onInput}
            @blur=${controller.onBlur}
            .value=${controller.value.deep?.path ?? ''}>
        </form>
      `;
      await element.updateComplete;
    });

    test('change sets deep path', async () => {
      const input = element.shadowRoot!.querySelector<HTMLInputElement>(
        'input[name="deep.path"]'
      )!;

      input.value = 'bob';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      const valueText =
        element.shadowRoot!.querySelector<HTMLDivElement>('#value')!;

      assert.is(
        valueText.textContent,
        JSON.stringify({
          deep: {
            path: 'bob'
          }
        })
      );
      assert.equal(controller.value, {deep: {path: 'bob'}});
      assert.is(controller.value, value);
    });
  });

  suite('fields by id', () => {
    let value: {email?: string};
    let controller: FormController<typeof value>;

    setup(async () => {
      value = {};

      const fixtureResult = await fixture<typeof value>(value, {});
      element = fixtureResult.element;
      controller = fixtureResult.controller;

      element.template = () => html`
        <div id="value">${JSON.stringify(value)}</div>
        <form ${controller.attach()}>
          <input
            type="string"
            id="email"
            @change=${controller.onChange}
            @input=${controller.onInput}
            @blur=${controller.onBlur}
            .value=${controller.value.email ?? ''}>
        </form>
      `;
      await element.updateComplete;
    });

    test('supports id attribute', async () => {
      const input =
        element.shadowRoot!.querySelector<HTMLInputElement>('input#email')!;

      input.value = 'foo';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      const valueText =
        element.shadowRoot!.querySelector<HTMLDivElement>('#value')!;

      assert.is(valueText.textContent, JSON.stringify({email: 'foo'}));
      assert.equal(controller.value, {email: 'foo'});
      assert.is(controller.value, value);
    });
  });

  test('ignores elements without identifiers', async () => {
    const value: {email?: string} = {};
    const fixtureResult = await fixture<typeof value>(value, {});
    const controller = fixtureResult.controller;
    element = fixtureResult.element;
    element.template = () => html`
      <div id="value">${JSON.stringify(value)}</div>
      <form ${controller.attach()}>
        <input
          type="string"
          @change=${controller.onChange}
          @input=${controller.onInput}
          @blur=${controller.onBlur}
          .value=${controller.value.email ?? ''}>
      </form>
    `;
    await element.updateComplete;

    const input = element.shadowRoot!.querySelector<HTMLInputElement>('input')!;

    input.value = 'foo';
    input.dispatchEvent(new Event('input'));
    await element.updateComplete;

    const valueText =
      element.shadowRoot!.querySelector<HTMLDivElement>('#value')!;

    assert.is(valueText.textContent, JSON.stringify({}));
    assert.equal(controller.value, {});
    assert.is(controller.value, value);
  });

  suite('immutable', () => {
    let value: {email?: string};
    let controller: FormController<typeof value>;

    setup(async () => {
      value = {};

      const fixtureResult = await fixture<typeof value>(value, {
        immutable: true
      });
      element = fixtureResult.element;
      controller = fixtureResult.controller;
      element.template = () => html`
        <div id="value">${JSON.stringify(value)}</div>
        <form ${controller.attach()}>
          <input
            type="string"
            name="email"
            @change=${controller.onChange}
            @input=${controller.onInput}
            @blur=${controller.onBlur}
            .value=${controller.value.email ?? ''}>
        </form>
      `;
      await element.updateComplete;
    });

    test('changes result in new value', async () => {
      const input = element.shadowRoot!.querySelector<HTMLInputElement>(
        'input[name="email"]'
      )!;

      const oldValue = value;

      input.value = 'foo';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      const newValue = controller.value;

      assert.is.not(oldValue, newValue);
      assert.equal(oldValue, {});
      assert.equal(newValue, {email: 'foo'});
    });
  });
});