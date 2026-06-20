// 🍔 Toggle dropdown menu for navigation
function toggleDropdown(x) {
  const menu = document.getElementById("myLinks");
  menu.classList.toggle("active"); // Toggle the "active" class to show/hide the dropdown
  x.classList.toggle("change"); // Optional: Add a class to animate the hamburger icon
}