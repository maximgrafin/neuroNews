// Load the custom app ES6 modules

import NewsDataService from 'src/users/services/NewsDataService';

import UsersList from 'src/users/components/list/UsersList';
import NewsList from 'src/users/components/list/NewsList';
import NewsDetails from 'src/users/components/details/NewsDetails';

// Define the Angular 'users' module

export default angular
  .module("users", ['ngMaterial'])

  .component(UsersList.name, UsersList.config)
  .component(NewsList.name, NewsList.config)
  .component(NewsDetails.name, NewsDetails.config)

  .service("NewsDataService", NewsDataService);
