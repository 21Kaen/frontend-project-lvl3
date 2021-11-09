import 'bootstrap/dist/css/bootstrap.css';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import parse from './parse.js';

const state = {
  request: 'default',
  isValid: 'default',
  addedUrls: [],
  posts: [],
  feeds: [],
  clickedInd: [],
};

const feedbackEl = document.querySelector('.feedback');
const inputEl = document.querySelector('input');
const buttonEl = document.querySelector('#addButton');
const postsContainer = document.querySelector('.posts');
const feedsContainer = document.querySelector('.feeds');
const form = document.querySelector('.rss-form');

inputEl.focus();

const watchedState = onChange(state, (path, value) => {
  if (path === 'isValid') {
    switch (value) {
      case 'url-invalid':
        feedbackEl.textContent = 'Ссылка должна быть валидным URL';
        feedbackEl.classList.add('text-danger');
        inputEl.classList.add('is-invalid');
        break;
      case 'rss-invalid':
        feedbackEl.textContent = 'Ресурс не содержит валидный RSS';
        feedbackEl.classList.add('text-danger');
        inputEl.classList.add('is-invalid');
        break;
      case 'exists':
        feedbackEl.textContent = 'RSS уже существует';
        feedbackEl.classList.add('text-danger');
        inputEl.classList.add('is-invalid');
        break;
      case 'valid':
        feedbackEl.textContent = 'RSS успешно загружен';
        feedbackEl.classList.remove('text-danger');
        feedbackEl.classList.add('text-success');
        inputEl.classList.remove('is-invalid');
        form.reset();
        inputEl.focus();
        break;
      case 'networkErr':
        feedbackEl.textContent = 'Ошибка сети';
        feedbackEl.classList.add('text-danger');
        inputEl.classList.add('is-invalid');
        break;
      default:
        break;
    }
  }
  if (path === 'request') {
    switch (value) {
      case 'processing':
        buttonEl.setAttribute('disabled', true);
        break;
      case 'static':
        buttonEl.removeAttribute('disabled');
        break;
      default:
        break;
    }
  }
  if (path === 'posts') {
    const innerContainer = document.createElement('div');
    innerContainer.classList.add('card', 'border-0');
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('card-body');
    const title = document.createElement('h2');
    title.classList.add('card-tittle', 'h4');
    title.textContent = 'Посты';
    titleDiv.append(title);
    innerContainer.append(titleDiv);
    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    state.posts.forEach((post) => {
      const postIndex = state.posts.indexOf(post);
      const postItem = document.createElement('li');
      postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      if (!state.clickedInd.includes(postIndex)) {
        postItem.innerHTML = `
        <a href="${post.link}" class="fw-bold click-check" target="_blank" rel="noopener noreferrer" data-post-index="${postIndex}">${post.title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm click-check" data-post-index="${postIndex}">Просмотр</button>
        `;
      } else {
        postItem.innerHTML = `
        <a href="${post.link}" class="fw-normal link-secondary click-check" target="_blank" rel="noopener noreferrer" data-post-index="${postIndex}">${post.title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm click-check" data-post-index="${postIndex}">Просмотр</button>
        `;
      }
      ul.prepend(postItem);
    });
    innerContainer.append(ul);
    postsContainer.innerHTML = innerContainer.outerHTML;
  }
  if (path === 'feeds') {
    const innerContainer = document.createElement('div');
    innerContainer.classList.add('card', 'border-0');
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('card-body');
    const title = document.createElement('h2');
    title.classList.add('card-tittle', 'h4');
    title.textContent = 'Фиды';
    titleDiv.append(title);
    innerContainer.append(titleDiv);
    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    state.feeds.forEach((feed) => {
      const feedItem = document.createElement('li');
      feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');
      feedItem.innerHTML = `
      <h3 class="h6 m-0">${feed.title}</h3>
      <p class="m-0 small text-black-50">${feed.description}</p>
      `;
      ul.prepend(feedItem);
    });
    innerContainer.append(ul);
    feedsContainer.innerHTML = innerContainer.outerHTML;
  }
  if (path === 'clickedInd') {
    const lastIndex = value[value.length - 1];
    const li = document.querySelector(`a[data-post-index="${lastIndex}"]`);
    li.classList.remove('fw-bold');
    li.classList.add('fw-normal', 'link-secondary');
  }
});

const validate = (urlObj) => {
  const schema = yup.object().shape({
    url: yup.string().url(),
  });
  return schema.isValidSync(urlObj);
};

const getData = (url) => axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => response.data);

const update = (initialState, links) => {
  const result = [];
  const watchedState = initialState;
  watchedState.posts.forEach((post) => {
    result.push(post);
  });
  const promises = links.map((link) => getData(link).then((data) => parse(data.contents))
    .then((rssData) => {
      const { postsData } = rssData;
      const arr = [];
      postsData.forEach((post) => arr.push(post));
      return arr;
    }));
  Promise.all(promises).then((values) => values.forEach((arr) => {
    const newPosts = _.differenceWith(arr, result, _.isEqual);
    newPosts.forEach((post) => result.push(post));
  })).then(() => {
    watchedState.posts = result;
  });
  setTimeout(() => update(watchedState, links), 5000);
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const url = formData.get('url');
  const validation = validate({ url });
  if (!validation) {
    watchedState.isValid = 'url-invalid';
  }
  if (validation && watchedState.addedUrls.includes(url)) {
    watchedState.isValid = 'exists';
  }
  if (validation && !watchedState.addedUrls.includes(url)) {
    watchedState.request = 'processing';
    getData(url).then((data) => parse(data.contents))
      .then((rssData) => {
        const { feedData, postsData } = rssData;
        watchedState.feeds.push(feedData);
        postsData.forEach((post) => watchedState.posts.push(post));
        watchedState.addedUrls.push(url);
        watchedState.isValid = 'valid';
        watchedState.request = 'static';
        watchedState.isValid = 'default';
      })
      .catch((err) => {
        if (err.message === 'rss invalid') {
          watchedState.isValid = 'rss-invalid';
        } else watchedState.isValid = 'networkErr';
        watchedState.request = 'static';
      })
      .then(() => update(watchedState, state.addedUrls));
  }
});

postsContainer.addEventListener('click', (e) => {
  const postIndex = e.target.classList.contains('click-check') ? Number(e.target.dataset.postIndex) : false;
  if (postIndex !== false && !state.clickedInd.includes(postIndex)) {
    watchedState.clickedInd.push(postIndex);
  }
});
