import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { firebase } from '../firebase/firebaseConfig';

const Account = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = firebase.auth().onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        setLoading(false); // Hide the loader if there's no user
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const userRef = firebase.database().ref(`users/${uid}`);
      userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUser({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
          });
          setProfileImageUrl(data.profileImageUrl);
        }
        setLoading(false); // Hide the loader after data is fetched
      });
    } catch (error) {
      console.error("Error fetching user data: ", error);
      setLoading(false); // Hide the loader even if there's an error
    }
  };

  const checkDriverStatus = async (email) => {
    try {
      const driverRef = firebase.database().ref('driverRef');
      const snapshot = await driverRef.once('value');
      const drivers = snapshot.val();

      if (drivers) {
        const isDriver = Object.values(drivers).some(driver => driver.email === email);

        if (isDriver) {
          navigation.navigate('DriverHome', { screen: 'NotificationReceiverScreen' });
        } else {
          navigation.navigate('personalInfo');
        }
      } else {
        navigation.navigate('personalInfo');
      }
    } catch (error) {
      console.error("Error checking driver status: ", error);
      navigation.navigate('personalInfo');
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('UserInfo');
  };

  const handleLogout = () => {
    firebase.auth().signOut().then(() => {
      navigation.navigate('SignIn');
    }).catch((error) => {
      console.error("Error signing out: ", error);
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleEditProfile} style={styles.profileContainer}>
        <View style={styles.profileContent}>
          <View style={styles.profilePictureContainer}>
            {profileImageUrl ? (
              <Image style={styles.profilePicture} source={{ uri: profileImageUrl }} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <FontAwesome name="user-circle" size={60} color="#ccc" />
              </View>
            )}
          </View>
          <View>
            <Text style={styles.name}>{user ? user.name || 'N/A' : 'Name'}</Text>
            <Text style={styles.email}>{user ? user.email || 'Email' : 'Email'}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={() => checkDriverStatus(user?.email)}>
          <OptionItem icon="car" label="Become a Driver" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('PostComplaint')}>
          <OptionItem icon="exclamation-triangle" label="Post a Complaint" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('Booking')}>
          <OptionItem icon="history" label="View History" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('DriverLocation')}>
          <OptionItem icon="map-marker" label="Driver Location" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <OptionItem icon="sign-out" label="Logout" style={styles.logout} />
      </TouchableOpacity>
    </View>
  );
};

const OptionItem = ({ icon, label }) => (
  <View style={styles.optionItem}>
    <FontAwesome name={icon} size={24} color="#484848" />
    <Text style={styles.optionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePictureContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profilePicturePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#808080',
  },
  email: {
    fontSize: 16,
    color: '#808080',
    marginLeft: 20,
  },
  optionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  optionLabel: {
    fontSize: 18,
    marginLeft: 15,
    color: '#484848',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  logout: {
    fontSize: 18,
    color: '#FF3B30',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Account;
