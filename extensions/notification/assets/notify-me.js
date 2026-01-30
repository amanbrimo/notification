document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('notify-me-wrapper');
  const variantInput = document.getElementById('notify-variant-id');
  const form = document.getElementById('notify-me-form');
  const message = document.getElementById('notify-message');

  
  const productSection = container 
    ? (container.closest('section') || container.closest('.product') || container.parentElement)
    : null;

  function checkAvailability() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentVariantId = urlParams.get('variant');

    if (!currentVariantId && window._initialVariantId) {
      currentVariantId = window._initialVariantId;
    }

    const variantData = window._notifyVariants 
      ? window._notifyVariants.find(v => v.id == currentVariantId)
      : null;

    if (variantData) {
      
      if (variantInput) variantInput.value = variantData.id;

      
      if (!variantData.available) {
        
        if (container) container.style.display = 'block';
        
        if (productSection) productSection.classList.add('hide-buy-buttons');
        
        toggleDirectButtons(false);

      } else {
        
        if (container) container.style.display = 'none';

        if (productSection) productSection.classList.remove('hide-buy-buttons');
        
        toggleDirectButtons(true);
      }
    }
  }

  function toggleDirectButtons(show) {
    const selectors = [
      '.product-form', 
      '.product-form__buttons', 
      '.shopify-payment-button', 
      '[name="add"]',
      'form[action*="/cart/add"]'
    ];
    const elements = document.querySelectorAll(selectors.join(','));
    elements.forEach(el => {
      if (!show) {
        el.style.display = 'none';
      } else {
        el.style.display = ''; 
      }
    });
  }

  checkAvailability();
  
  setTimeout(checkAvailability, 500);

  
  const originalPushState = history.pushState;
  history.pushState = function() { originalPushState.apply(this, arguments); checkAvailability(); };
  
  const originalReplaceState = history.replaceState;
  history.replaceState = function() { originalReplaceState.apply(this, arguments); checkAvailability(); };
  
  window.addEventListener('popstate', checkAvailability);


 
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const values = Object.fromEntries(formData.entries());
      const btn = form.querySelector('button');

      
        const input = {
          product: values.product_id,
          productVariant: values.variant_id,
          phone: values.phone,
          client: "Q2xpZW50OjIyNw==",
          email: values.email || "", 
          name: values.name || ""
        } 

      try {
        btn.innerText = "Sending...";
        btn.disabled = true;

        const res = await fetch(
          `https://gauravhapi.farziengineer.co/graphql/?source=website`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              query: `
                mutation CREATE_NOTIFICATION_ENTRY($input:NotifyInput!) {
                  createNotify(
                    input: $input
                  ) {
                    notify {
                      id
                      email
                      phone
                      product
                      productVariant
                      name
                      client{
                        clientName
                      }
                      createdAt
                      isNotified
                    }
                  }
                }
              `,
              variables: { input },
            }),
          }
        );

        const result = await res.json();

        if (result?.errors?.length > 0) {
          message.style.color = 'red';
          message.innerText = "Error: " + result.errors[0].message;
          message.style.display = 'block';
          btn.innerText = "Retry";
          btn.disabled = false;
        } else {
          form.style.display = 'none';
          message.style.color = 'green';
          message.innerText = "Success! We'll WhatsApp you.";
          message.style.display = 'block';
        }
      } catch (error) {
        console.error(error);
        message.innerText = "Network error. Please refresh.";
        btn.innerText = "Notify Me";
        btn.disabled = false;
      }
    });
  }
});