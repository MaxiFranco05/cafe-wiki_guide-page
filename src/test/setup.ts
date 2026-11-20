import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import { resetSharedStorageAdapter } from '../adapters';

// jsdom implements <dialog> without the modal API: open/close by attribute is enough for tests.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

// Each test starts with a fresh shared storage mirror (re-read from the jsdom localStorage).
beforeEach(() => {
  resetSharedStorageAdapter();
});
