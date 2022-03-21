const express = require('express');
const router = express.Router();
const passport = require('passport')
const catchAsync = require('../utils/catchAsync');

const Campground = require('../models/campground');
const Review = require('../models/review');


const campgrounds = require('../controllers/campgrounds');
const { isLoggedIn, validateCampground, isAuthor } = require('../middleware')

const { storage } = require('../cloudinary/index');// cloudinary 

// pasring multipart files (files)---> body[text] and files(files)[files uploaded]
const multer = require('multer');
const upload = multer({ storage })

router.route('/')
    .get(catchAsync(campgrounds.index))// index
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampgrounds));// post for new campground

router.get('/new', isLoggedIn, campgrounds.renderNewForm);// new campground render form

router.route('/:id')
    .get(catchAsync(campgrounds.showCampgrounds))// show
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))// update camp
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampgrounds));// delete camp 

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));// edit


module.exports = router;