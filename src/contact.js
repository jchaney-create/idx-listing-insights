/**
 * Locate the best contact action on the current IDX details page.
 */
export function findContactAction() {
  const formContainer = document.querySelector(
    '#IDX-detailsContactForm, #IDX-detailscontactContainer, #IDX-scheduleshowingContainer'
  );
  if (formContainer) {
    return {
      type: 'scroll',
      targetId: formContainer.id,
      label: 'Contact agent about this property',
    };
  }

  const contactForm = document.querySelector(
    '#IDX-detailscontactContactForm, #IDX-scheduleshowingContactForm, form.IDX-contactForm'
  );
  if (contactForm) {
    const targetId = contactForm.id || contactForm.closest('[id]')?.id;
    if (targetId) {
      return {
        type: 'scroll',
        targetId,
        label: 'Contact agent about this property',
      };
    }
  }

  const modalTrigger = document.querySelector('#IDX-detailsContactLink[data-modal]');
  if (modalTrigger) {
    return {
      type: 'modal',
      selector: '#IDX-detailsContactLink',
      label: 'Contact agent about this property',
    };
  }

  const moreInfoLink = document.querySelector(
    '#IDX-moreinfo, #IDX-detailsDescriptionActionsMoreInfo, a[href*="/idx/moreinfo/"]'
  );
  if (moreInfoLink?.href) {
    return {
      type: 'link',
      href: moreInfoLink.href,
      label: moreInfoLink.textContent?.trim() || 'Request more information',
    };
  }

  return null;
}

export function activateContactAction(action) {
  if (!action) return false;

  if (action.type === 'link' && action.href) {
    window.location.href = action.href;
    return true;
  }

  if (action.type === 'modal') {
    const trigger = document.querySelector(action.selector);
    if (trigger) {
      trigger.click();
      return true;
    }
  }

  if (action.type === 'scroll' && action.targetId) {
    const target = document.getElementById(action.targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      return true;
    }
  }

  return false;
}

export function attachContactCta(container, action) {
  const button = container.querySelector('[data-ili-contact-cta]');
  if (!button || !action) {
    if (button) button.style.display = 'none';
    return;
  }

  button.addEventListener('click', (event) => {
    event.preventDefault();
    if (!activateContactAction(action)) {
      window.location.hash = action.targetId ? `#${action.targetId}` : '#IDX-detailsContactForm';
    }
  });
}
