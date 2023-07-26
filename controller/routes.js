const path = require('path');
const fs = require('fs').promises;
const authMiddleware = require('../middleware/authMiddleware');
const user_model = require('../model/users');
const express = require('express');
const passport = require('passport');
const routes = express.Router();
const multer = require('multer');
const mime = require('mime-types');
const bcrypt = require('bcrypt');
const filestack = require('filestack-js');
const crypto = require('crypto');
const axios = require('axios');

/*const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  },
});*/
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
const upload = multer({ 
  fileFilter: function (req, file, cb) {
    const ext = mime.extension(file.mimetype);
    if (allowedImageExtensions.includes(ext)) {
      cb(null, true); // Accept the file if it is an image
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false); // Reject the file if it is not an image
    }
  }, 
});
const User = user_model.users;


// Rendering first page
routes.get('/', async (req, res) => {
  res.render('index');
});

//register
routes.get('/register', authMiddleware.checkNotAuthenticated, (req, res) => {
  res.render('register')
});

//registration
routes.post('/registration', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already exists");
      req.flash('success', 'Email is already registered with another account');
      return res.redirect('/register');
    }

    // Hash the password using bcrypt
    bcrypt.hash(password, 10, async (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).send('Internal Server Error');
      }

      try {
        // Create a new USER document with the hashed password
        const user = new User({
          username,
          email,
          password: hashedPassword,
        });

        // Save the USER to the database
        await user.save();

        req.flash('success', 'Registration Successful');
        res.redirect('/home');
      } catch (error) {
        console.error('Error Register User:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  } catch (error) {
    console.error('Error checking existing user:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get Login page
routes.get('/login', authMiddleware.checkNotAuthenticated, (req, res) => {
  res.render('login');
});
// Login Post
routes.post('/login', authMiddleware.checkNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      req.session.userid = user._id; // Set the userid in the session
      return res.redirect('/home');
    });
  })(req, res, next);
});

// logout
routes.delete('/logout', (req, res) => {
  req.logOut(() => {
    req.flash('success', 'Logged Out Successfully');
    res.redirect('/')
  })

});

// Home Page
routes.get('/home', authMiddleware.checkAuthenticated, async (req, res) => {

  try {
    const loggedInUser = await User.findById(req.session.userid);
    res.render('newhome', { User: loggedInUser });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

routes.post('/upload',upload.single('image'),authMiddleware.checkAuthenticated, async (req, res) => {
  if (!req.body.fileUrl) {
    console.error('No file URL received');
    return res.status(400).send('No file URL received');
  }

  const user = await User.findById(req.session.userid);
  if (!user) {
    console.error('User not found');
    return res.status(404).send('User not found');
  }

  try {
    const fileUrl = req.body.fileUrl;
    user.images.push(fileUrl);
    await user.save();
    console.log('File URL added to user images successfully:');
  } catch (error) {
    console.error('Error updating user data:', error);
    return res.status(500).send('Internal Server Error');
  }

  return res.status(200).send('File URL added successfully');
});

  



//delete photo
routes.delete('/delete/:filename', async (req, res) => {
  const { filename } = req.params;
  const apiSecret = process.env.MY_K;

  function generatePolicyAndSignature() {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 60 * 5; // 5 minutes expiration time
  
    const policy = {
      call: ['remove'],
      expiry,
    };
  
    const policyB64 = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = crypto.createHmac('sha256', apiSecret).update(policyB64).digest('hex');
  
    return {
      policy: policyB64,
      signature,
    };
  }
  try {
    // Get the user from the database
    const user = await User.findById(req.session.userid);
    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }


    // Find the image URL in the user's images array
    const imageUrl = user.images.find((image) => image.includes(filename));
    if (!imageUrl) {
      console.error('Image URL not found');
      return res.status(404).send('Image URL not found');
    }

    const { policy, signature } = generatePolicyAndSignature();
    
    const apikey = process.env.FS_API;
    const deleteUrl = `https://www.filestackapi.com/api/file/${filename}?key=${apikey}&policy=${policy}&signature=${signature}`;

    // Send a DELETE request to the delete URL using Axios
    const response = await axios.delete(deleteUrl);

    // Check if the deletion was successful
    if (response.status === 200) {
      
    user.images = user.images.filter((image) => !image.includes(filename));
    await user.save();

      return res.sendStatus(200);
    } else {
      return res.status(response.status).send(response.statusText);
    }


  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).send('Internal Server Error');
  }
});




// profile
routes.get('/profile', authMiddleware.checkAuthenticated, async (req, res) => {
  res.render('profile', { user: await User.findOne({_id:req.session.userid}) });
});

/*

//follow
routes.post('/follow/:userId',authMiddleware.checkAuthenticated,async (req, res) => {

  try {
    const  {userId}  = req.params;
    const loggedInUser = await User.findOne({_id:req.session.userid})

    if (loggedInUser.friends.includes(userId)) {
      console.log('User is already in the friends list');
      return res.redirect('/addfriend'); 
    }
    loggedInUser.friends.push(userId);
    await loggedInUser.save();
    
    res.redirect('/addfriend')
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).send('Internal Server Error');
  }
});
//Unfollow
routes.post('/unfollow/:userId',authMiddleware.checkAuthenticated,async (req, res) => {

  try {
    const  {userId}  = req.params;
    
    const loggedInUser = await User.findOne({_id:req.session.userid})

    loggedInUser.friends.pop(userId)
    await loggedInUser.save();
    
    res.redirect('/')
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).send('Internal Server Error');
  }
});




//add friend
routes.get('/addfriend',authMiddleware.checkAuthenticated, async (req, res) => {
  try {
    const loggedInUser = await User.findOne({ _id: req.session.userid }).populate('friends');
    const friendIds = loggedInUser.friends.map(friend => friend._id);
    const users = await User.find({ _id: { $ne: req.session.userid, $nin: friendIds } });
    res.render('addfriend', { User: users });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
  //res.render('addfriend',{ User: await User.find({ email: { $ne: req.session.userid }}) })
})














// All product data
routes.get('/allproduct', authMiddleware.checkAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userid)
  console.log(user.email)
  res.render('../pages/allproduct', { Product: await Product.find({email:user.email}) });
});

// Render add product form
routes.get('/addproduct', authMiddleware.checkAuthenticated, (req, res) => {
  res.render('addproduct');
});

// Submit button API in add product form
routes.post('/submit', upload.single('thumbnail'), async (req, res) => {
  const { title, description, price, discountPercentage } = req.body;
  const user = await User.findById(req.session.userid);
  console.log(user.email);
  try {
    const thumbnail = req.file.path.replace('public\\', '');
    // Create a new Product document
    const product = new Product({
      title,
      description,
      price: parseFloat(price),
      discountPercentage: parseFloat(discountPercentage),
      thumbnail,
      email: user.email
    });
    // Save the product to the database
    await product.save();
    res.send('Product saved successfully!');
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).send('Internal Server Error');
  }
});

routes.get('/htl', authMiddleware.checkAuthenticated,async (req, res) => {
  console.log('Server started /htl');
  // Server Side Rendering
  res.render('../pages/allproduct', {
    Product: await Product.find({_id:req.session.userid}).sort({ price: 1 }),
  });
});
*/
module.exports = routes;