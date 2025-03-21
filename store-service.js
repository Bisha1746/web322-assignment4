const fs = require("fs");

let items = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile("./data/items.json", "utf8", (err, data) => {
      if (err) {
        reject("Unable to read items.json");
        return;
      }
      items = JSON.parse(data);

      fs.readFile("./data/categories.json", "utf8", (err, catData) => {
        if (err) {
          reject("Unable to read categories.json");
          return;
        }
        categories = JSON.parse(catData);
        resolve();
      });
    });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    items.length ? resolve(items) : reject("No results returned");
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const published = items.filter(item => item.published);
    published.length ? resolve(published) : reject("No results returned");
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filtered = items.filter(
      item => item.published && item.category == category
    );
    filtered.length ? resolve(filtered) : reject("No results returned");
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    categories.length ? resolve(categories) : reject("No results returned");
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filtered = items.filter(item => item.category == category);
    filtered.length ? resolve(filtered) : reject("No results returned");
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const filtered = items.filter(
      item => new Date(item.postDate) >= new Date(minDateStr)
    );
    filtered.length ? resolve(filtered) : reject("No results returned");
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    const item = items.find(item => item.id == id);
    item ? resolve(item) : reject("No result returned");
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;
    itemData.id = items.length + 1;
    itemData.postDate = new Date().toISOString().split("T")[0];
    items.push(itemData);
    resolve(itemData);
  });
}

module.exports = {
  initialize,
  getAllItems,
  getCategories,
  getPublishedItems,
  getPublishedItemsByCategory,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  addItem
};
