const path = process.cwd();
import Event from '../models/event';
import User from '../models/users';
import passport from 'passport';
import _ from 'lodash';

const generateID = () => {
  let ID = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    ID += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return ID;
};

export default (app) => {
  /*
  ....###....########..####..######.
  ...##.##...##.....##..##..##....##
  ..##...##..##.....##..##..##......
  .##.....##.########...##...######.
  .#########.##.........##........##
  .##.....##.##.........##..##....##
  .##.....##.##........####..######.
  */

  /* auth stuff */

  app.route('/api/auth/current')
    .get((req, res) => {
      res.status(200).send(req.user);
    });

  app.route('/api/auth/github')
    .get(passport.authenticate('github'));

  app.route('/api/auth/github/callback')
    .get(passport.authenticate('github', {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
    }));

  app.route('/api/auth/facebook')
    .get(passport.authenticate('facebook'));

  app.route('/api/auth/facebook/callback')
    .get(passport.authenticate('facebook', {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
    }));


  app.route('/api/auth/local/login')
    .post(passport.authenticate('login', {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
    }));

  app.route('/api/auth/local/signup')
    .post(passport.authenticate('signup', {
      successRedirect: '/dashboard',
      failureRedirect: '/signup',
      failureFlash: true,
    }));

  app.route('/api/auth/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  /* meeetings API*/
  app.route('/api/events')
    .get((req, res) => {
      Event.find((err, events) => {
        if (err) res.status(500).send(err);
        return res.status(200).json(events);
      });
    })
    .post((req, res) => {
      console.log(req.user);
      const name = (req.user.facebook.username ||
                      req.user.github.username ||
                      req.user.local.username);
      const avatar = (req.user.facebook.avatar ||
                      req.user.github.avatar ||
                      req.user.local.avatar);
      req.body.participants = [{ name, avatar }];
      req.body.owner = name;
      req.body.uid = generateID();
      Event.create(req.body, (err, event) => {
        if (err) return res.status(500).send(err);
        return res.status(201).json(event);
      });
    });

  app.route('/api/events/:id')
    .get((req, res) => {
      Event.findById(req.params.id, (err, event) => {
        if (err) return res.status(500).send(err);
        if (!event) return res.status(404).send('Not found.');
        return res.status(200).json(event);
      });
    })
    .put((req, res) => {
      Event.findById(req.params.id, (err, event) => {
        if (err) return res.status(500).send(err);
        if (!event) return res.status(404).send('Not found.');

        const updated = _.extend(event, req.body);
        updated.save(err => {
          if (err) return res.status(500).send(err);
          return res.status(200).json(event);
        });
      });
    })
    .delete((req, res) => {
      Event.findById(req.params.id, (err, event) => {
        if (err) return res.status(500).send(err);
        if (!event) return res.status(404).send('Not found.');

        event.remove(err => {
          if (err) return res.status(500).send(err);
          return res.status(204).send('No Content');
        });
      });
    });

  app.route('/api/events/:id/updateAvail')
    .post((req, res) => {
      console.log(req.body);
      Event.findById(req.params.id, (err, doc) => {
        if (err) return res.status(500).send(err);
        if (doc) {
          let participants;
          let newParticipant;
          let userExists = false;
          if (req.body.user.local) {
            if (doc.participants.length !== 0) {
              participants = doc.participants;
              participants.map(user => {
                if (user.name === req.body.user.local.username) {
                  user.availibility = req.body.data;
                  userExists = true;
                }
                if (user.name !== req.body.user.local.username) {
                  newParticipant = {
                    avatar: req.body.user.local.avatar,
                    name: req.body.user.local.username,
                    availibility: req.body.data,
                  };
                }
                return user;
              });
              if (newParticipant !== null && !userExists) participants.push(newParticipant);
            } else {
              participants = {
                avatar: req.body.user.local.avatar,
                name: req.body.user.local.username,
                availibility: req.body.data,
              };
            }
          }
          if (req.body.user.github) {
            if (doc.participants.length !== 0) {
              participants = doc.participants;
              participants.map(user => {
                if (user.name === req.body.user.github.username) {
                  user.availibility = req.body.data;
                  userExists = true;
                }
                if (user.name !== req.body.user.github.username) {
                  newParticipant = {
                    avatar: req.body.user.github.avatar,
                    name: req.body.user.github.username,
                    availibility: req.body.data,
                  };
                }
                return user;
              });
              if (newParticipant !== null && !userExists) participants.push(newParticipant);
            } else {
              participants = {
                avatar: req.body.user.github.avatar,
                name: req.body.user.github.username,
                availibility: req.body.data,
              };
            }
          }
          if (req.body.user.facebook) {
            if (doc.participants.length !== 0) {
              participants = doc.participants;
              participants.map(user => {
                if (user.name === req.body.user.facebook.username) {
                  user.availibility = req.body.data;
                  userExists = true;
                }
                if (user.name !== req.body.user.facebook.username) {
                  newParticipant = {
                    avatar: req.body.user.facebook.avatar,
                    name: req.body.user.facebook.username,
                    availibility: req.body.data,
                  };
                }
                return user;
              });
              if (newParticipant !== null && !userExists) participants.push(newParticipant);
            } else {
              participants = {
                avatar: req.body.user.facebook.avatar,
                name: req.body.user.facebook.username,
                availibility: req.body.data,
              };
            }
          }
          doc.participants = participants;
          doc.markModified('participants');
          doc.save(() => {
            if (err) console.log(err);

            console.log(doc);
          });
          return;
        }
      });
    });

  app.route('/api/events/getbyuid/:uid')
    .get((req, res) => {
      const uid = req.params.uid;
      console.log(uid);
      Event.find({ uid }, (err, events) => {
        if (err) res.status(500).send(err);
        return res.status(200).json(events);
      });
    });

  /* users API */
  app.route('/api/users')
    .get((req, res) => {
      User.find((err, users) => {
        if (err) res.status(500).send(err);
        return res.status(200).json(users);
      });
    })
    .post((req, res) => {
      User.create(req.body, (err, user) => {
        if (err) return res.status(500).send(err);
        return res.status(201).json(user);
      });
    });

  app.route('/api/users/:id')
    .get((req, res) => {
      User.findById(req.params.id, (err, user) => {
        if (err) return res.status(500).send(err);
        if (!user) return res.status(404).send('Not found.');
        return res.status(200).json(user);
      });
    })
    .put((req, res) => {
      User.findById(req.params.id, (err, user) => {
        if (err) return res.status(500).send(err);
        if (!user) return res.status(404).send('Not found.');

        const updated = _.extend(user, req.body);
        updated.save(err => {
          if (err) return res.status(500).send(err);
          return res.status(200).json(user);
        });
      });
    })
    .delete((req, res) => {
      User.findById(req.params.id, (err, user) => {
        if (err) return res.status(500).send(err);
        if (!user) return res.status(404).send('Not found.');

        user.remove(err => {
          if (err) return res.status(500).send(err);
          return res.status(204).send('No Content');
        });
      });
    });

  app.route('/api/users/:id/events')
    .get((req, res) => {
      const username = (req.user.facebook.username ||
                        req.user.github.username ||
                        req.user.local.username);
      Event.find({ 'participants.name': username }, (err, events) => {
        if (err) return res.status(500).send(err);
        return res.status(200).json(events);
      });
    });

  app.route('*')
    .get((req, res) => res.sendFile(`${path}/build/index.html`));
};
