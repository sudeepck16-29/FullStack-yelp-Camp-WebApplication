const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}
module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', "welcome to Yelp Camp");
            res.redirect('/campgrounds');
        })
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('register')
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}
module.exports.Login = async (req, res) => {
    req.flash('success', "succefully logined in welcome back to campgrounds");
    const rediectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(rediectUrl);
}
module.exports.logout = (req, res) => {
    req.logOut();
    req.flash('success', "succefully logout");
    res.redirect('/campgrounds');
}