// // src/App.js
// import React, { useState, useEffect } from 'react';

// // import API from Amplify library
// import { API, Auth, Storage } from 'aws-amplify';

// // import query definition
// import { listPosts } from './graphql/queries';

// import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
// import { v4 as uuid } from 'uuid';

// function App() {
//   const [posts, setPosts] = useState([]);
//   const [images, setImages] = useState([]);
//   useEffect(() => {
//     // fetchPosts();
//     // checkUser();
//     fetchImages();
//   }, []);
//   async function fetchPosts() {
//     try {
//       const postData = await API.graphql({ query: listPosts });
//       setPosts(postData.data.listPosts.items);
//     } catch (err) {
//       console.log({ err });
//     }
//   }

//   async function checkUser() {
//     const user = await Auth.currentAuthenticatedUser();
//     console.log('user: ', user);
//     console.log('user attributes: ' + JSON.stringify(user.attributes));
//   }

//   async function fetchImages() {
//     // fetch list of imgaes from S3
//     let images = await Storage.list('');
//     // get URL to display images in the app
//     images = await Promise.all(
//       images.map(async (image) => {
//         const signedImage = await Storage.get(image.key);
//         return signedImage;
//       })
//     );
//     setImages(images);
//   }

//   function uploadImage(e) {
//     if (!e.target.files[0]) return;
//     const file = e.target.files[0];
//     // upload the image, then fetch & re-render images
//     Storage.put(uuid(), file).then(() => fetchImages());
//   }

//   return (
//     // <div>
//     //   <h1>Hello World</h1>
//     //   {posts.map((post) => (
//     //     <div key={post.id}>
//     //       <h3>{post.name}</h3>
//     //       <p>{post.location}</p>
//     //     </div>
//     //   ))}
//     //   <AmplifySignOut />
//     // </div>
//     <div>
//       <h1>Photo Album!!!</h1>
//       <span>Add new image:</span>
//       <input type='file' accept='image/png' onChange={uploadImage} />
//       <div style={{ display: 'flex', flexDirection: 'column' }}>
//         {images.map((image) => (
//           <img src={image} style={{ width: 400, marginBottom: 10 }} />
//         ))}
//       </div>
//       <AmplifySignOut />
//     </div>
//   );
// }

// export default withAuthenticator(App);

import React, { useState, useEffect } from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { css } from '@emotion/css';
import { API, Storage, Auth } from 'aws-amplify';
import { listPosts } from './graphql/queries';

import Posts from './Posts';
import Post from './Post';
import Header from './Header';
import CreatePost from './CreatePost';
import Button from './Button';

function Router() {
  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);

  /* fetch posts when component loads */
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    // query the api, ask for 100 items
    let postData = await API.graphql({
      query: listPosts,
      variables: { limit: 100 },
    });
    let postsArray = postData.data.listPosts.items;

    // get signed image URLs for each image
    postsArray = await Promise.all(
      postsArray.map(async (post) => {
        const imageKey = await Storage.get(post.image);
        post.image = imageKey;
        return post;
      })
    );

    // update posts array in local state
    setPostState(postsArray);
  }

  async function setPostState(postsArray) {
    updatePosts(postsArray);
  }

  return (
    <>
      <HashRouter>
        <div className={contentStyle}>
          <Header />
          <hr className={dividerStyle} />
          <Button
            title='New Post'
            onClick={() => updateOverlayVisibility(true)}
          />
          <Switch>
            <Route exact path='/'>
              <Posts posts={posts} />
            </Route>
            <Route path='/post/:id'>
              <Post />
            </Route>
          </Switch>
        </div>
        <AmplifySignOut />
      </HashRouter>
      {showOverlay && (
        <CreatePost
          updateOverlayVisibility={updateOverlayVisibility}
          updatePosts={setPostState}
          posts={posts}
        />
      )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`;

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`;

export default withAuthenticator(Router);
