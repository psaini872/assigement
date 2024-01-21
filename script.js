const APIURL = 'https://api.github.com/users/';
const APIURL1 = 'https://api.github.com/';

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const paginationContainer = document.getElementById('pagination');
const reposEl = document.getElementById('repos');
let currentPage = 1;
let itemsPerPage = 10;
let totalRepos;
let user;

async function getUser(username) {
  try {
    paginationContainer.innerHTML = '';
    reposEl.innerHTML = '';
    main.innerHTML = '<div class="loading">Loading...</div>';
    const { data } = await axios(APIURL + username);
    totalRepos = data.public_repos;
    currentPage = 1;
    createUserCard(data);
    getRepos(username);
  } catch (err) {
    if (err.response.status == 404) {
      createErrorCard('No profile with this username');
    }
  }
}

async function getRepos(username) {
  try {
    reposEl.innerHTML = '<div class="loading">Loading...</div>';
    const { data } = await axios(
      `${APIURL}${username}/repos?sort=created&per_page=${itemsPerPage}&page=${currentPage}`
    );
    const reposWithLanguages = await Promise.all(
      data.map(async (repo) => {
        const { data: languages } = await axios(
          `${APIURL1}repos/${username}/${repo.name}/languages`
        );

        repo.languages = Object.keys(languages);
        return repo;
      })
    );

    createPagination();
    addReposToCard(reposWithLanguages);
  } catch (err) {
    createErrorCard('Problem fetching repos');
  }
}

function createUserCard(user) {
  const userID = user.name || user.login;
  const userBio = user.bio ? `<p>${user.bio}</p>` : '';
  const cardHTML = `
    <div class="card">
        <div>
        <img src="${user.avatar_url}" alt="${user.name}" class="avatar">
        </div>
        <div class="user-info">
        <h2>${userID}</h2>
        ${userBio}
        <ul>
            <li>${user.followers} <strong>Followers</strong></li>
            <li>${user.following} <strong>Following</strong></li>
            <li>${user.public_repos} <strong>Repos</strong></li>
        </ul>

        </div>
    </div>
    `;
  main.innerHTML = cardHTML;
}

function createErrorCard(msg) {
  const cardHTML = `
        <div class="card">
            <h1>${msg}</h1>
        </div>
    `;

  main.innerHTML = cardHTML;
}

function addReposToCard(repos) {
  reposEl.innerHTML = '';

  repos.forEach(({ html_url, name, languages, description }) => {
    const repoEl = document.createElement('div');
    repoEl.classList.add('repo');

    const repoLink = document.createElement('a');
    repoLink.href = html_url;
    repoLink.target = '_blank';
    repoLink.innerText = name;

    const repoDetails = document.createElement('div');
    repoDetails.classList.add('repo-details');

    const repoTech = document.createElement('p');

    languages.forEach((language) => {
      const langBox = document.createElement('span');
      langBox.classList.add('lang-box');
      langBox.innerText = language;
      repoTech.appendChild(langBox);
    });

    const repoDesc = document.createElement('p');
    repoDesc.innerHTML = `<strong>Description:</strong> ${
      description
        ? truncateDescription(description)
        : 'No description available'
    }`;

    repoDetails.appendChild(repoTech);
    repoDetails.appendChild(repoDesc);

    repoEl.appendChild(repoLink);
    repoEl.appendChild(repoDetails);

    reposEl.appendChild(repoEl);
  });
}

function truncateDescription(description) {
  const words = description.split(' ');
  const truncated = words.slice(0, 15).join(' ');
  return truncated + (words.length > 30 ? '...' : '');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  user = search.value;

  if (user) {
    getUser(user);

    search.value = '';
  }
});




function createPagination() {
  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(totalRepos / itemsPerPage);

  const paginationToolbar = document.createElement('div');
  paginationToolbar.classList.add('pagination-toolbar');

  const prevButton = createPaginationButton('Prev', currentPage > 1, () =>
    changePage(currentPage - 1)
  );

  const nextButton = createPaginationButton(
    'Next',
    currentPage < totalPages,
    () => changePage(currentPage + 1)
  );

  const itemsPerPageSection = document.createElement('div');
  itemsPerPageSection.classList.add('items-per-page');
  itemsPerPageSection.innerHTML = `
                <label for="itemsPerPage">Items per page:</label>
                <input type="number" id="itemsPerPage" min="10" max="100" value="${itemsPerPage}" />
                <button class="btn btn-primary" onclick="updateItemsPerPage()">Update</button>
            `;

  const pageNumbersSection = document.createElement('div');
  pageNumbersSection.classList.add('page-numbers');

  pageNumbersSection.appendChild(prevButton);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = createPaginationButton(i, true, () => changePage(i));
    pageNumbersSection.appendChild(pageButton);
  }

  pageNumbersSection.appendChild(nextButton);

  paginationToolbar.appendChild(itemsPerPageSection);
  paginationToolbar.appendChild(pageNumbersSection);

  paginationContainer.appendChild(paginationToolbar);
}

function createPaginationButton(text, isEnabled, onClick) {
  const button = document.createElement('button');
  button.classList.add('btn', 'btn-outline-primary', 'mr-2', 'rounded', 'p-2');
  button.textContent = text;
  button.disabled = !isEnabled;
  button.addEventListener('click', onClick);

  if (text === currentPage) {
    button.classList.add('current-page');
  }

  return button;
}

function changePage(newPage) {
  currentPage = newPage;
  getRepos(user);
}

function updateItemsPerPage() {
  const newItemsPerPage = parseInt(
    document.getElementById('itemsPerPage').value
  );
  if (newItemsPerPage >= 10 && newItemsPerPage <= 100) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1;

    getRepos(user);
  } else {
    alert('Please enter a valid value between 10 and 100 for items per page.');
  }
}
