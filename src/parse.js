const getContent = (el, tag) => el.querySelector(tag).textContent;

export default (data) => {
  const result = {
    feedData: {},
    postsData: [],
  };
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (doc.querySelector('rss') === null) {
    throw new Error('rss invalid');
  }
  const feedTitle = getContent(doc, 'title');
  const feedDescription = getContent(doc, 'description');

  const posts = doc.querySelectorAll('item');
  result.feedData = { title: feedTitle, description: feedDescription };

  posts.forEach((post) => {
    const postTitle = getContent(post, 'title');
    const postDescription = getContent(post, 'description');
    const postLink = getContent(post, 'link');
    result.postsData.unshift(
      {
        title: postTitle,
        description: postDescription,
        link: postLink,
      },
    );
  });
  return result;
};
