/**
 * Template Service for rendering Handlebars templates
 */
import Handlebars from 'handlebars';

// Register helpers for use in templates - do this once at module level
Handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

Handlebars.registerHelper('formatCurrency', function(amount) {
  if (amount === undefined || amount === null) return '₹0.00';
  return `₹${amount.toFixed(2)}`;
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
  return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('calculateTax', function(price, quantity, gstRate) {
  if (!price || !quantity || !gstRate) return '₹0.00';
  const taxAmount = (price * quantity) * (gstRate / 100);
  return `₹${taxAmount.toFixed(2)}`;
});

// Helper for multiplication - used in order templates
Handlebars.registerHelper('multiply', function(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    a = parseFloat(a) || 0;
    b = parseFloat(b) || 0;
  }
  return a * b;
});

// Helper for addition - used in order templates
Handlebars.registerHelper('add', function(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    a = parseFloat(a) || 0;
    b = parseFloat(b) || 0;
  }
  return a + b;
});

/**
 * Render a template with the given data
 * @param templateString Handlebars template string
 * @param data Data to use in the template
 * @returns Rendered HTML string
 */
export function renderTemplate(templateString, data) {
  try {
    // Compile the template
    const template = Handlebars.compile(templateString);
    
    // Render template with data
    return template(data);
  } catch (error) {
    console.error('Template rendering error:', error);
    return `<p>Error rendering template: ${error.message}</p>`;
  }
}

// Default export for compatibility with multiple import styles
export default { renderTemplate };