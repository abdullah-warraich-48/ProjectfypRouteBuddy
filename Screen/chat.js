import { onValue, push, ref, set } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Bubble, GiftedChat, MessageText } from 'react-native-gifted-chat';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

const Chat = ({ route }) => {
  const { currentUser } = useContext(UserContext);
  const { chatId } = route.params || {};

  const currentUserEmail = currentUser?.email;

  // Log route.params for debugging
  console.log("Route params:", route.params);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchChatMessages = () => {
      if (!chatId) {
        console.log("Chat ID is missing");
        return;
      }

      const chatRef = ref(firebase.database(), `chats/${chatId}/messages/`);
      onValue(chatRef, (snapshot) => {
        if (snapshot.exists()) {
          const messageData = snapshot.val();
          const messageArray = Object.keys(messageData).map((key) => ({
            ...messageData[key],
            _id: key,
            user: {
              _id: messageData[key].user,
              name: messageData[key].user === currentUserEmail ? 'User' : 'Driver',
              avatar: messageData[key].user === currentUserEmail ? require('../assets/a.jpg') : require('../assets/aa.png'),
            },
          }));
          setMessages(messageArray.reverse());
        } else {
          const defaultMessage = {
            _id: 'system-message',
            text: 'Chat is created',
            createdAt: new Date().getTime(),
            user: {
              _id: 'system',
              name: 'System',
              avatar: null,
            },
          };
          setMessages([defaultMessage]);
        }
      });
    };

    fetchChatMessages();
  }, [chatId, currentUserEmail]);

  const onSend = async (newMessages = []) => {
    if (!chatId) {
      console.error('Error: chatId is undefined');
      return;
    }

    try {
      const newMessage = newMessages[0];
      const chatMessagesRef = ref(firebase.database(), `chats/${chatId}/messages`);
      const newMessageRef = push(chatMessagesRef);

      const message = {
        _id: newMessageRef.key,
        text: newMessage.text,
        createdAt: new Date().getTime(),
        user: currentUserEmail,
      };

      setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
      await set(newMessageRef, message);
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  const renderAvatar = (props) => {
    return <Image style={styles.avatar} source={require('../assets/aa.png')} />;
  };

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: {
          backgroundColor: '#088F8F',
        },
        right: {
          backgroundColor: '#32a4a8',
        },
      }}
    />
  );

  const renderMessageText = (props) => (
    <MessageText
      {...props}
      textStyle={{
        left: {
          color: '#fff',
        },
        right: {
          color: '#fff',
        },
      }}
    />
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={(newMessages) => onSend(newMessages)}
      user={{ _id: currentUserEmail }}
      renderAvatar={renderAvatar}
      renderBubble={renderBubble}
      renderMessageText={renderMessageText}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default Chat;
