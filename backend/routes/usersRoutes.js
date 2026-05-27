const express = require('express');
const router  = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, getSections } = require('../controllers/usersController');

router.get('/sections', getSections);   // must be before /:id
router.get('/',         getUsers);
router.get('/:id',      getUserById);
router.post('/',        createUser);
router.put('/:id',      updateUser);
router.delete('/:id',   deleteUser);

module.exports = router;
