import React, { useState, useEffect, createContext, useContext } from 'react'
import { db, storage, timestamp } from '../firebase'
import { AuthContext } from './authContext'
import { PortfolioContext } from './context'

const ForumContext = createContext()

const ForumProvider = ({ children }) => {
  // const history = useHistory()
  const { currentUser } = useContext(AuthContext)
  const { user } = useContext(PortfolioContext)
  const [posts, setPosts] = useState([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  const createPost = (_post) => {
    if (!currentUser && !user.username) return
    setLoading(true)
    const _docRef = db.collection('forum')

    const { postImage } = _post
    // add forum with out an image
    if (!postImage) {
      _docRef
        .add({
          post: _post,
          author: user.email,
          comments: [],
          createdAt: timestamp(),
        })
        .then(() => setLoading(false))
        .finally(() => {
          window.location = '/posts'
        })
    }

    // upload/update image url only
    const types = ['image/png', 'image/jpeg']

    if (postImage && types.includes(postImage.type)) {
      const stgRef = storage.ref(_post.postTitle + currentUser.uid)
      stgRef.put(postImage).on(
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
            // get post image url
            // when upload is done !
            _docRef
              .add({
                post: {
                  ..._post,
                  postImage: url,
                },
                author: user.email,
                comments: [],
                createdAt: timestamp(),
              })
              .then(() => setLoading(false))
              .finally(() => {
                window.location = '/posts'
              })
          })
        }
      )
    }
  }

  // this method is looking for a posts by its postId
  // and returns his doc when its found
  const isPostExists = (docId) => {
    return db.collection('forum').doc(docId)
  }

  const addComment = (_post, _comment) => {
    setLoading(true)
    const date = Date.now()
    const _userComment = {
      userEmail: user.email,
      comment: _comment,
      createdAt: date,
    }
    const _docRef = db.collection('forum').doc(_post.docId)

    _docRef.get().then((_doc) => {
      if (_doc.exists) {
        _docRef
          .update({
            comments: [..._doc.data().comments, _userComment],
          })
          .finally(() => setLoading(false))
      }
    })
  }

  // getting posts from forum collection
  useEffect(() => {
    const unsubscribe = db
      .collection('forum')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const _posts = snapshot.docs.map((_doc) => {
          return {
            docId: _doc.id,
            ..._doc.data(),
          }
        })

        setPosts(_posts)
      })

    return unsubscribe
  }, [])

  const values = { posts, createPost, isPostExists, addComment, progress, loading }

  return <ForumContext.Provider value={values} children={children} />
}

export { ForumContext, ForumProvider }
