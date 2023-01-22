import '../util.js';

import {html} from 'lit';
import type {PropertyDeclarations} from 'lit';
import * as assert from 'uvu/assert';
import {MarkdownController} from '../../main.js';
import {TestElementBase} from '../util.js';

/**
 * Test element for the markdown controller
 */
class MarkdownTestElement extends TestElementBase {
  public prop?: string;

  /** @inheritdoc */
  public static override get properties(): PropertyDeclarations {
    return {
      prop: {type: String}
    };
  }
}

customElements.define('markdown-test', MarkdownTestElement);

suite('MarkdownController', () => {
  let element: MarkdownTestElement;
  let controller: MarkdownController<MarkdownTestElement, 'prop'>;

  teardown(() => {
    element.remove();
  });

  suite('default', () => {
    setup(async () => {
      element = document.createElement('markdown-test') as MarkdownTestElement;
      controller = new MarkdownController(element);
      element.controllers.push(controller);
      element.template = () => html`${controller.value}`;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    test('initialises to undefined', () => {
      assert.equal(controller.value, undefined);
      assert.equal(element.shadowRoot!.textContent, '');
    });

    suite('setValue', () => {
      test('updates markdown with new value', async () => {
        await controller.setValue('foo');
        await element.updateComplete;

        assert.is.not(controller.value, undefined);
        assert.match(element.shadowRoot!.innerHTML, '<p>foo</p>');
      });

      test('leaves markdown untouched if last value unchanged', async () => {
        await controller.setValue('foo');
        await element.updateComplete;

        const p = element.shadowRoot!.querySelector('p')!;

        await controller.setValue('foo');
        await element.updateComplete;

        const newP = element.shadowRoot!.querySelector('p')!;

        assert.is(newP, p);
        assert.is.not(controller.value, undefined);
        assert.match(element.shadowRoot!.innerHTML, '<p>foo</p>');
      });
    });
  });

  suite('options.property', () => {
    setup(async () => {
      element = document.createElement('markdown-test') as MarkdownTestElement;
      element.prop = 'foo';
      controller = new MarkdownController(element, {property: 'prop'});
      element.controllers.push(controller);
      element.template = () => html`${controller.value}`;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    test('initialises to current property value', () => {
      assert.is.not(controller.value, undefined);
      assert.match(element.shadowRoot!.innerHTML, '<p>foo</p>');
    });

    test('observes changes to property', async () => {
      element.prop = 'bar';
      await element.updateComplete;

      assert.is.not(controller.value, undefined);
      assert.match(element.shadowRoot!.innerHTML, '<p>bar</p>');
    });
  });
});