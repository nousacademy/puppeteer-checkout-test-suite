new Vue({
  el: '#qa-app',
  data: {
    test_results: {},
    search: "",
    isActive: false,
    envoyPasses: 0,
    envoyFails: 0
  },
  created() {
    // fetch test results from database on initial load
    fetch('/test_data')
    .then((response) => response.text())
    .then((text) => {
      this.test_results = JSON.parse(text);
      let passes = this.test_results.passes.filter(test => test.fullTitle.match(/envoy/));
      let fails = this.test_results.failures.filter(test => test.fullTitle.match(/envoy/));
      this.envoyPasses = passes.length;
      this.envoyFails = fails.length;
    })
    .catch((error) => console.log(error));
  },
  computed: {
    filteredList: function() {
      if (this.test_results.suites){
        return this.test_results.suites.filter(suite => {
          return suite.title.includes(this.search);
        });
      }
    }
    // envoyPasses: () => {
      // var vm = this._data;
      // if (vm.test_results.length > 0) {
      //
      //   var passes = vm.test_results.passes.map((test) => {
      //     // test.fullTitle.match(/envoy/) && test.result === "passed"
      //     console.log(test)
      //   });
      //   console.log(passes)
      // }
      // var passes = this.test_results.passes.filter(test => test.fullTitle.match(/envoy/));
      // return passes;
    // },
    // envoyFailures: () => {
    //
    // }
  },
  methods: {
    details: (test) => {
      console.log(test)
      // test_results.classObject.isActive = true;
      // console.log(test_results.isActive)
    }
    // envoyPasses: () => {
    //   var passes = this.test_results.passes.map(test => test.fullTitle.match(/envoy/) && test.result === "passed");
    //   console.log(this.test_results)
    //   return passes;
    // }
  }
});
