import React, { Component } from 'react';
import autobind from 'autobind-decorator';
import fetch from 'isomorphic-fetch';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import NotificationsIcon from 'material-ui/svg-icons/social/notifications';
import Badge from 'material-ui/Badge';
import Divider from 'material-ui/Divider';
import { browserHistory } from 'react-router';
import cssModules from 'react-css-modules';

import { checkStatus } from '../../util/fetch.util';
import styles from './notification-bar.css';

class NotificationBar extends Component {

  @autobind
  static handleEventLinkClick(id) {
    browserHistory.push(`/event/${id}`);
  }

  static async handleDismiss(participantId) {
    const response = await fetch(`/api/events/GuestNotificationDismiss/${participantId}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      method: 'PATCH',
    });
    try {
      checkStatus(response);
    } catch (err) {
      console.error('handleDismiss', err);
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      events: this.props.events,
      notificationColor: '#A7A7A7',
      curUser: this.props.curUser,
      quantOwnerNotNotified: 0,
    };
  }

  componentWillMount() {
    const { events, curUser } = this.props;
    this.setState({ events, curUser });
    this.IconButtonColor();
  }

  componentWillReceiveProps(nextProps) {
    const { events } = nextProps;
    this.setState({ events });
    this.IconButtonColor();
  }

  @autobind
  async handleDismissAll() {
    const { events } = this.state;
    events.forEach((event) => {
      event.participants.forEach((participant) => {
        if (participant.ownerNotified === false) {
          this.props.cbHandleDismissGuest(participant._id);
        }
      });
    });
    this.setState({ notificationColor: '#ffffff', quantOwnerNotNotified: 0 });
  }

  IconButtonColor() {
    const { events, curUser } = this.state;
    let notificationColor;
    let quantOwnerNotNotified = 0;
    if (events.length > 0) {
      notificationColor = '#ffffff';
      events.forEach((event) => {
        event.participants.forEach((participant) => {
          if (participant.userId._id.toString() !== curUser._id && participant.ownerNotified === false) {
            notificationColor = '#ff0000';
            quantOwnerNotNotified += 1;
          }
        });
      });
    }
    this.setState({ notificationColor, quantOwnerNotNotified });
  }

  renderMenuRows() {
    const { events, curUser } = this.state;
    const rows = [];

    if (events) {
      events.forEach((event) => {
        event.participants.forEach((participant) => {
          if (participant.userId._id !== curUser._id) {
            let bkgColor = '#ffffff';
            if (!participant.ownerNotified) {
              bkgColor = '#EEEEFF';
            }
            const row = (
              <MenuItem
                key={`${participant._id} first`}
                value={participant._id}
                style={{ backgroundColor: bkgColor }}
                styleName="menuItem"
              >
                {participant.userId.name} <span>accepted your invitation for &#32;</span>
                <a
                  onTouchTap={() => this.constructor.handleEventLinkClick(event._id)}
                  styleName="eventLink"
                >{event.name}</a>.
              </MenuItem>
            );
            rows.push(row);
            rows.push(<Divider key={`${participant._id} divider`} style={{ width: '100%' }} />);
          }
        });
      });
    }
    return rows;
  }

  render() {
    const { quantOwnerNotNotified, events } = this.state;
    const visible = (quantOwnerNotNotified === 0) ? 'hidden' : 'visible';
    const openMenu = (events.length === 0) ? false : null;
    const inLineStyles = {
      badge: {
        right: 47,
        top: 30,
        visibility: visible,
        fontSize: '12px',
        width: 16,
        height: 16,
      },
      iconButton: {
        icon: {
          color: 'white',
          width: '19px',
        },
      },
    };
    return (
      <IconMenu
        maxHeight={300}
        open={openMenu}
        iconStyle={inLineStyles.iconButton}
        style={{ height: '40px', width: '40px', margin: '-54px 18px 0px 0px' }}
        iconButtonElement={
          <Badge
            badgeContent={quantOwnerNotNotified}
            secondary
            badgeStyle={inLineStyles.badge}
          >
            <IconButton
              tooltip="Notifications"
              onTouchTap={this.handleDismissAll}
              iconStyle={inLineStyles.iconButton.icon}
            >
              <NotificationsIcon size={10} />
            </IconButton>
          </Badge>
        }
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {this.renderMenuRows()}
      </IconMenu >
    );
  }
}

NotificationBar.propTypes = {
  curUser: React.PropTypes.object,
  events: React.PropTypes.array,
  cbHandleDismissGuest: React.PropTypes.func,
};

export default cssModules(NotificationBar, styles);
