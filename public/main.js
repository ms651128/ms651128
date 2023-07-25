function submitForm() {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout?_method=DELETE';

    // Submit the form
    document.body.appendChild(form);
    form.submit();
  }