/**
 * Handles when the `instructor` value for a user is changed.
 * @param {HTMLElement} checkbox the checkbox which was clicked
 */
function onInstructorChange(checkbox) {
  $.post('/admin/users/update', {
    email: $(checkbox).parent().prev().text(),
    instructor: checkbox.checked,
  }, (err) => {
    if (!err) {
      $('#info-bar span').text('Your changes have been saved.');
      $('#info-bar').fadeIn();
    }
  });
}
