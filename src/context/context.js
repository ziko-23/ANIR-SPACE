import React, { useState, useEffect, createContext, useContext } from 'react'
import { db, storage } from '../firebase'
import { AuthContext } from './authContext'

const PortfolioContext = createContext()

const PortfolioProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext)

  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  // this method is looking for a users by its username
  // and returns his doc when its found
  const isUserExists = (username) => {
    return db.collection('users').where('username', '==', username).get()
  }

  const changeUserBackground = (file) => {
    // if no user is logged in return
    // (don't execute the other code)
    if (!currentUser) return
    setLoading(true)
    const _docRef = db.collection('users').doc(currentUser.email)
    // upload/update image url only
    const types = ['image/png', 'image/jpeg']

    if (file && types.includes(file.type)) {
      const stgRef = storage.ref('images' + file.name + currentUser.uid)
      stgRef.put(file).on(
        'state_changed',
        (snap) => {
          // uploading
          const _percentage = (snap.bytesTransferred / snap.totalBytes) * 100
          setProgress(_percentage)
        },
        (err) => setLoading(false),
        () => {
          // on finish upload
          stgRef.getDownloadURL().then((url) => {
            _docRef
              .update({
                bgImage: url,
              })
              .then(() => setLoading(false))
              .finally(() => setProgress(0))
          })
        }
      )
    }
  }

  // this is the main function for updating user profile
  const updateUserProfile = (info) => {
    // if no user is logged in return
    // (don't execute the other code)
    if (!currentUser) return

    setLoading(true)
    // change username if not exists in users collection
    let exists = false
    const _docRef = db.collection('users').doc(currentUser.email)
    db.collection('users')
      .where('username', '==', info.username)
      .get()
      .then((_result) => {
        const data = _result.docs.map((_doc) => {
          return {
            docId: _doc.id,
            ..._doc.data(),
          }
        })
        exists = data.length > 0 ? true : false
        if (!exists) {
          _docRef
            .update({
              username: info.username,
            })
            .finally(() => setLoading(false))
          setMessage('user was updated successfully')
        }
      })
    //END: update username

    // upload/update image url only
    const { file } = info
    const types = ['image/png', 'image/jpeg']

    if (file && types.includes(file.type)) {
      const stgRef = storage.ref(currentUser.uid)
      stgRef.put(file).on(
        'state_changed',
        (snap) => {
          // uploading
          const _percentage = (snap.bytesTransferred / snap.totalBytes) * 100
          setProgress(_percentage)
        },
        (err) => setLoading(false),
        () => {
          // on finish upload
          stgRef.getDownloadURL().then((url) => {
            _docRef
              .update({
                photoURL: url,
              })
              .then(() => setLoading(false))
              .finally(() => {
                setMessage('user profile image was updated successfully')
                setProgress(0)
              })
          })
        }
      )
    }

    _docRef
      .update({
        bio: info.bio,
        address: info.address,
        birthDate: info.birthDate,
      })
      .then(() => setLoading(false))
      .finally(() => {
        setMessage('user profile info was updated successfully')
      })

    setTimeout(() => {
      setMessage(null)
    }, 2500)
  }

  const updateSkill = (skills) => {
    setLoading(true)
    const _docRef = db.collection('users').doc(currentUser.email)
    _docRef
      .update({
        skills: skills,
      })
      .finally(() => setLoading(false))
  }

  const updateExperience = (_experience) => {
    setLoading(true)
    const _docRef = db.collection('users').doc(currentUser.email)
    _docRef
      .update({
        experience: _experience,
      })
      .finally(() => setLoading(false))
  }

  // adding projects to firestore / storage
  const addProject = (_projectObj, _projects) => {
    setLoading(true)
    const _docRef = db.collection('users').doc(currentUser.email)

    // upload/update image url only
    const { projectImage } = _projectObj
    const types = ['image/png', 'image/jpeg']

    if (projectImage && types.includes(projectImage.type)) {
      const stgRef = storage.ref(projectImage.name + currentUser.uid)
      stgRef.put(projectImage).on(
        'state_changed',
        (snap) => {
          // uploading
          const _percentage = (snap.bytesTransferred / snap.totalBytes) * 100
          setProgress(_percentage)
        },
        (err) => setLoading(false),
        () => {
          // on finish upload
          stgRef.getDownloadURL().then((url) => {
            _docRef
              .update({
                projects: [
                  ..._projects,
                  {
                    ..._projectObj,
                    projectImage: url, // from file to string
                  },
                ],
              })
              .then(() => setLoading(false))
              .finally(() => {
                setMessage('user profile image was updated successfully')
                setProgress(0)
              })
          })
        }
      )
    }
  }

  // remove project from fire store
  const removeProject = (_projects) => {
    setLoading(true)
    const _docRef = db.collection('users').doc(currentUser.email)
    _docRef
      .update({
        projects: _projects,
      })
      .then(() => setLoading(false))
  }

  useEffect(() => {
    // getting users only if they have a username
    const unsubscribe = db.collection('users').onSnapshot((snapshot) => {
      const _users = snapshot.docs
        .filter((_doc) => (_doc.data().username !== '' ? true : false))
        .map((_doc) => {
          return {
            docId: _doc.id,
            ..._doc.data(),
          }
        })

      setUsers(_users)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!currentUser) return

    // getting the current logged-in user his info (username, bio, age, ...)
    const _docRef = db.collection('users').doc(currentUser.email)

    const unsubscribe = _docRef.onSnapshot((_doc) => {
      if (_doc.exists) {
        setUser({
          docId: _doc.id,
          ..._doc.data(),
        })
      }
    })

    return unsubscribe
  }, [currentUser])

  const values = {
    updateUserProfile,
    users,
    isUserExists,
    message,
    user,
    progress,
    updateSkill,
    updateExperience,
    addProject,
    removeProject,
    changeUserBackground,
    loading,
    setLoading,
  }

  return <PortfolioContext.Provider value={values} children={children} />
}

export { PortfolioContext, PortfolioProvider }
