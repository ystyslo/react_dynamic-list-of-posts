import 'bulma/css/bulma.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.scss';

import cn from 'classnames';
import { PostsList } from './components/PostsList';
import { PostDetails } from './components/PostDetails';
import { UserSelector } from './components/UserSelector';
import { Loader } from './components/Loader';
import { User } from './types/User';
import { useEffect, useState } from 'react';
import * as ClientAPI from './api/users';
import { Post } from './types/Post';
import { Comment } from './types/Comment';

export const App = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isPostsError, setIsPostsError] = useState(false);

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isCommentsError, setIsCommentsError] = useState(false);

  const [isNewCommentFormVisible, setIsNewCommentFormVisible] = useState(false);

  const isEmptyPosts = posts !== null && posts.length === 0;
  const isPostsReady = posts !== null && posts.length > 0;

  const shouldShowNoPosts = !isPostsLoading && !isPostsError && isEmptyPosts;
  const shouldShowPostsList = !isPostsLoading && !isPostsError && isPostsReady;

  useEffect(() => {
    ClientAPI.getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    if (selectedUser === null) {
      return;
    }

    setIsPostsError(false);
    setComments([]);
    setSelectedPost(null);
    setPosts(null);

    setIsPostsLoading(true);
    ClientAPI.getPosts(selectedUser.id)
      .then(setPosts)
      .catch(() => {
        setIsPostsError(true);
      })
      .finally(() => {
        setIsPostsLoading(false);
      });
  }, [selectedUser]);

  useEffect(() => {
    if (selectedPost === null) {
      return;
    }

    setIsCommentsError(false);
    setIsCommentsLoading(true);
    setComments(null);
    ClientAPI.getComments(selectedPost ? selectedPost.id : null)
      .then(setComments)
      .catch(() => {
        setIsCommentsError(true);
      })
      .finally(() => {
        setIsNewCommentFormVisible(false);
        setIsCommentsLoading(false);
      });
  }, [selectedPost]);

  const deleteComment = async (commentId: number) => {
    if (comments === null) {
      return;
    }

    setComments(comments.filter(comment => comment.id !== commentId));
    try {
      await ClientAPI.deleteComment(commentId);
    } catch {
      setIsCommentsError(true);
    }
  };

  const addComment = (
    postId: number,
    { name, email, body }: Omit<Comment, 'id' | 'postId'>,
  ) => {
    if (comments === null) {
      return;
    }

    const newComment = {
      name: name,
      email: email,
      body: body,
      postId: postId,
    };

    setIsCommentsLoading(true);

    ClientAPI.addComment(postId, newComment)
      .then(comment => {
        setComments([...comments, comment]);
      })
      .catch(() => {
        setIsCommentsError(true);
      })
      .finally(() => {
        setIsCommentsLoading(false);
      });
  };

  return (
    <main className="section">
      <div className="container">
        <div className="tile is-ancestor">
          <div className="tile is-parent">
            <div className="tile is-child box is-success">
              <div className="block">
                <UserSelector
                  users={users}
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                />
              </div>

              <div className="block" data-cy="MainContent">
                {!selectedUser && (
                  <p data-cy="NoSelectedUser">No user selected</p>
                )}

                {isPostsLoading && <Loader />}

                {isPostsError && (
                  <div
                    className="notification is-danger"
                    data-cy="PostsLoadingError"
                  >
                    Something went wrong!
                  </div>
                )}

                {shouldShowNoPosts && (
                  <div className="notification is-warning" data-cy="NoPostsYet">
                    No posts yet
                  </div>
                )}

                {shouldShowPostsList && (
                  <PostsList
                    posts={posts}
                    selectedPost={selectedPost}
                    onPostSelect={setSelectedPost}
                  />
                )}
              </div>
            </div>
          </div>

          <div
            data-cy="Sidebar"
            className={cn('tile', 'is-parent', 'is-8-desktop', 'Sidebar', {
              'Sidebar--open': selectedPost,
            })}
          >
            <div className="tile is-child box is-success ">
              {selectedPost && (
                <PostDetails
                  post={selectedPost}
                  comments={comments}
                  isCommentsLoading={isCommentsLoading}
                  isCommentsError={isCommentsError}
                  onCommentDelete={deleteComment}
                  addComment={addComment}
                  isNewCommentFormVisible={isNewCommentFormVisible}
                  setIsNewCommentFormVisible={setIsNewCommentFormVisible}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
