// Notice that we do not have a controller since this component does not
// have any specialized logic.

export default {
    name: 'newsList',
    config: {
        bindings: {
            newsList: '<',
            selected: '<',
            showDetails: '&onSelected',
            showColors: '<'
        },
        mmm:"asdasd",
        templateUrl: 'src/users/components/list/NewsList.html'
    }
};
