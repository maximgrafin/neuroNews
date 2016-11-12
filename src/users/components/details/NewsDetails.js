import NewsDetailsController from './NewsDetailsController'

export default {
  name : 'newsDetails',
  config : {
    bindings         : {  selected: '<' },
    templateUrl      : 'src/users/components/details/NewsDetails.html',
    controller       : [ '$mdBottomSheet', '$log', NewsDetailsController ]
  }
};