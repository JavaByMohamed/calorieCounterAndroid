import { mockNutritionDB, addIngredient, saveMockNutritionDB, syncFromCloud } from './mockDatabase.js';

// Populate the ingredient dropdown
function populateIngredientDropdown() {
  const ingredientDropdown = document.getElementById("ingredient");
  ingredientDropdown.innerHTML = ""; // Clear existing options

  // Add a default placeholder option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an ingredient";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  ingredientDropdown.appendChild(defaultOption);

  // Get sorted ingredient names
  const sortedIngredients = Object.keys(mockNutritionDB).sort();

  // Populate the dropdown with sorted ingredients
  sortedIngredients.forEach((ingredient) => {
    const option = document.createElement("option");
    option.value = ingredient;
    option.textContent = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
    ingredientDropdown.appendChild(option);
  });
}

// Populate the ingredient list
function displayIngredients() {
  const ingredientList = document.getElementById("ingredientList");
  if (!ingredientList) {
    console.error("Element with id 'ingredientList' not found.");
    return;
  }

  if (Object.keys(mockNutritionDB).length === 0) {
    ingredientList.innerHTML = "<p>No ingredients added yet.</p>";
    return;
  }

  let html = "<ul>";
  Object.keys(mockNutritionDB).sort().forEach((name) => {
    const data = mockNutritionDB[name];
    html += `
      <li>
        <strong>${name}</strong> - 
        Calories: ${data.calories.toFixed(2)}, 
        Protein: ${data.protein.toFixed(2)}g, 
        Fat: ${data.fat.toFixed(2)}g, 
        Carbs: ${data.carbs.toFixed(2)}g,
        Fiber: ${(data.fiber || 0).toFixed(2)}g
        <button class="edit-ingredient-btn" data-name="${name}">Edit</button>
        <button class="delete-ingredient-btn" data-name="${name}">Delete</button>
      </li>
    `;
  });
  html += "</ul>";

  ingredientList.innerHTML = html;

  // Add event listeners for delete buttons
  document.querySelectorAll(".delete-ingredient-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const name = this.getAttribute("data-name");
      deleteIngredient(name);
    });
  });

  // Add event listeners for edit buttons
  document.querySelectorAll(".edit-ingredient-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const name = this.getAttribute("data-name");
      editIngredient(name);
    });
  });
}

// Handle form submission to add a new ingredient
const addIngredientForm = document.getElementById("addIngredientForm");
let editingName = null; // Track the ingredient being edited

addIngredientForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("ingredientName").value.trim();
  const calories = document.getElementById("ingredientCalories").value;
  const protein = document.getElementById("ingredientProtein").value;
  const fat = document.getElementById("ingredientFat").value;
  const carbs = document.getElementById("ingredientCarbs").value;
  const fiber = document.getElementById("ingredientFiber") ? document.getElementById("ingredientFiber").value : 0;

  if (!name || isNaN(calories) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
    alert("Please enter valid ingredient details.");
    return;
  }

  // If we were editing, remove the old entry (in case name changed)
  if (editingName && editingName !== name.toLowerCase()) {
    delete mockNutritionDB[editingName];
  }
  editingName = null;

  // Add the new ingredient to the database
  addIngredient(name, calories, protein, fat, carbs, fiber);

  // Refresh the ingredient list
  displayIngredients();

  // Reset the form
  addIngredientForm.reset();

  // Re-enable all edit buttons
  document.querySelectorAll(".edit-ingredient-btn").forEach((button) => {
    button.disabled = false;
  });
});

// Delete an ingredient
function deleteIngredient(name) {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    delete mockNutritionDB[name];
    saveMockNutritionDB();
    displayIngredients();
  }
}

// Edit an ingredient (no longer deletes — just populates the form)
function editIngredient(name) {
  if (editingName) {
    alert("You are already editing an ingredient. Please save or cancel the current edit before editing another.");
    return;
  }

  editingName = name;
  const ingredientData = mockNutritionDB[name];

  // Populate the form with the ingredient's current values
  document.getElementById("ingredientName").value = name;
  document.getElementById("ingredientCalories").value = ingredientData.calories;
  document.getElementById("ingredientProtein").value = ingredientData.protein;
  document.getElementById("ingredientFat").value = ingredientData.fat;
  document.getElementById("ingredientCarbs").value = ingredientData.carbs;
  const fiberInput = document.getElementById("ingredientFiber");
  if (fiberInput) fiberInput.value = ingredientData.fiber || 0;

  // Disable all "Edit" buttons while editing
  document.querySelectorAll(".edit-ingredient-btn").forEach((button) => {
    button.disabled = true;
  });
}

// Call the functions on page load
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof waitForFirebase === "function") {
    await waitForFirebase();
  }
  await syncFromCloud();
  displayIngredients();
});