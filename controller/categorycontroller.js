const express = require("express");
const router = express;
const mongoose = require("../config/dbConnect");
const Admin = require("../model/adminModel");
const categoryCollection = require("../model/categoryModel");

//GET CONROL
///
exports.getCategorys = async (req, res) => {
  try {
    const categoryData = await categoryCollection.find();
    res.render("category", { categoryData });
  } catch (error) {
    console.log("Error whie category render", error);
  }
};

exports.getaddCategory = (req, res) => {
  res.render("addCategory");
};

//getedit

exports.getEditCategory = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await categoryCollection.find();
    const name = await categoryCollection.findById(id);

    res.render("editcategory", { id, name: name.categoryName });
  } catch (error) {
    res.status(500).render("error500");
  }
};

//////////
//post

exports.postAddCategory = async (req, res) => {
  const data = {
    categoryName: req.body.categoryName.toLowerCase(),
  };

  const existingCategory = await categoryCollection.findOne({
    categoryName: { $regex: new RegExp(`^${data.categoryName}$`, "i") },
  });

  if (existingCategory) {
    res.render("addCategory", { message: "Category Already Exists" });
  } else {
    const dataCreated = await categoryCollection.create({
      categoryName: data.categoryName,
    });
    res.redirect("/admin/category");
  }
};

//edit post

exports.postEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryCollection.findById(categoryId);

    if (!category) {
      return res.status(404).send('Category not found');
    }

    const newCategoryName = req.body.categoryName;

    if (!newCategoryName || newCategoryName.trim() === '' || newCategoryName.length > 10) {
      return res.render('editcategory', {
        id: categoryId,
        name: category.categoryName,
        message: 'Category name is required and should be less than 10 characters.',
      });
    }

    if (/^\d/.test(newCategoryName)) {
      return res.render('editcategory', {
        id: categoryId,
        name: category.categoryName,
        message: 'Category name cannot start with a number.',
      });
    }

    const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialCharsRegex.test(newCategoryName)) {
      return res.render('editcategory', {
        id: categoryId,
        name: category.categoryName,
        message: 'Category name cannot contain special characters.',
      });
    }

    const existingCategory = await categoryCollection.findOne({
      categoryName: { $regex: new RegExp(`^${newCategoryName}$`, 'i') },
      _id: { $ne: category._id },
    });

    if (existingCategory) {
      return res.render('editcategory', {
        id: categoryId,
        name: category.categoryName,
        message: 'Category with the same name already exists.',
      });
    }

    category.categoryName = newCategoryName;
    await category.save();

    res.redirect('/admin/category');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).send('Internal Server Error');
  }
};


//delete

exports.deleteCategory = async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const result = await categoryCollection.findByIdAndDelete(categoryId);

    if (!result) {
      return res.status(404).send("category not found");
    }
    res.redirect("/admin/category");
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("Internal Server Error");
  }
};

// softdelete

exports.visiblepost = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await categoryCollection.findById(id);
    if (!category) {
      return res.status(404).send("category not found");
    }
    category.isvisible = !category.isvisible;

    await category.save();
    res.redirect("/admin/category");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};
