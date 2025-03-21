/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
*  No part of this assignment has been copied manually or electronically from any other source
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Bishal Bhandari
*  Student ID: 173510231
*  Date: 2025-03-21
*  Cyclic Web App URL: https://your-cyclic-app.cyclic.app
*  GitHub Repository URL: https://github.com/your-username/web322-assignment4
********************************************************************************/

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const storeService = require("./store-service");

const app = express();
const PORT = process.env.PORT || 3000;

// Static and middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Cloudinary config
cloudinary.config({
  cloud_name: "your-cloud-name",
  api_key: "your-api-key",
  api_secret: "your-api-secret",
  secure: true,
});

const upload = multer();

// Handlebars setup
app.engine(".hbs", exphbs.engine({
  extname: ".hbs",
  helpers: {
    navLink: function(url, options) {
      return `<li class='nav-item'><a class='nav-link ${url == app.locals.activeRoute ? "active" : ""}' href='${url}'>${options.fn(this)}</a></li>`;
    },
    equal: function (lvalue, rvalue, options) {
      return lvalue != rvalue ? options.inverse(this) : options.fn(this);
    },
    safeHTML: function (context) {
      return new exphbs.handlebars.SafeString(context);
    }
  }
}));
app.set("view engine", ".hbs");

// Middleware to track current route
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split("/")[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Routes
app.get("/", (req, res) => res.redirect("/shop"));

app.get("/about", (req, res) => res.render("about"));

app.get("/items/add", (req, res) => res.render("addItem"));

app.post("/items/add", upload.single("featureImage"), async (req, res) => {
  let imageUrl = "";
  if (req.file) {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };
    try {
      const uploaded = await streamUpload(req);
      imageUrl = uploaded.url;
    } catch {
      return res.status(500).send("Image upload failed");
    }
  }

  req.body.featureImage = imageUrl;
  storeService.addItem(req.body)
    .then(() => res.redirect("/items"))
    .catch(() => res.status(500).send("Failed to add item"));
});

app.get("/items", (req, res) => {
  const { category, minDate } = req.query;
  if (category) {
    storeService.getItemsByCategory(category)
      .then(data => res.render("items", { items: data }))
      .catch(() => res.render("items", { message: "no results" }));
  } else if (minDate) {
    storeService.getItemsByMinDate(minDate)
      .then(data => res.render("items", { items: data }))
      .catch(() => res.render("items", { message: "no results" }));
  } else {
    storeService.getAllItems()
      .then(data => res.render("items", { items: data }))
      .catch(() => res.render("items", { message: "no results" }));
  }
});

app.get("/item/:id", (req, res) => {
  storeService.getItemById(req.params.id)
    .then(item => res.render("item", { item }))
    .catch(() => res.render("item", { message: "no result" }));
});

app.get("/categories", (req, res) => {
  storeService.getCategories()
    .then(data => res.render("categories", { categories: data }))
    .catch(() => res.render("categories", { message: "no results" }));
});

app.get("/shop", async (req, res) => {
  try {
    const category = req.query.category;
    const items = category
      ? await storeService.getPublishedItemsByCategory(category)
      : await storeService.getPublishedItems();
    const post = items.length ? items[0] : null;
    const categories = await storeService.getCategories();

    res.render("shop", {
      data: { items, post, categories }
    });
  } catch {
    res.render("shop", {
      data: {
        message: "no results",
        categoriesMessage: "no categories"
      }
    });
  }
});

app.get("/shop/:id", async (req, res) => {
  try {
    const category = req.query.category;
    const post = await storeService.getItemById(req.params.id);
    const items = category
      ? await storeService.getPublishedItemsByCategory(category)
      : await storeService.getPublishedItems();
    const categories = await storeService.getCategories();

    res.render("shop", {
      data: { items, post, categories }
    });
  } catch {
    res.render("shop", {
      data: {
        message: "no results",
        categoriesMessage: "no categories"
      }
    });
  }
});

app.use((req, res) => {
  res.status(404).render("404", { layout: false });
});

// Initialize and start
storeService.initialize()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => console.error("Failed to start server:", err));
