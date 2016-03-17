'use strict';

angular.module('codemill.premiere', ['codemill.adobe'])
  .service('cmPremiereService', ['$q', '$log', '$timeout', 'cmAdobeService',
    function ($q, $log, $timeout, adobeService) {

      var jobs = {};

      function registerJob(jobID, deferred) {
        jobs[jobID] = deferred;
      }

      function unregisterJob(jobID) {
        delete jobs[jobID];
      }

      function renderSequence(presetPath, outputPath, useInOutPoints) {
          return { method: 'renderSequence', args: [presetPath, outputPath, useInOutPoints] };
      }

      function getActiveSequence() {
        return { method : 'getActiveSequence', returnsObject : true };
      }

      function clearSequenceMarkers() {
        return { method : 'clearSequenceMarkers' };
      }

      function createSequenceMarkers(markers) {
        return { method : 'createSequenceMarkers', args : [markers] };
      }

      function getInMarkerPoint() {
        return { method: 'getInMarkerPoint' };
      }

      function handleRenderEvent(event) {
        var jobID = event.data.jobID;
        if (jobID in jobs) {
          var deferred = jobs[jobID];
          switch (event.data.type) {
            case 'error':
              $log.error('Failed rendering sequence', event.data.error);
              deferred.reject('Failed rendering sequence');
              unregisterJob(jobID);
              break;
            case 'progress':
              deferred.notify(event.data.progress * 100);
              break;
            case 'complete':
              $log.info('File from host: ', event.data.outputFilePath);
              deferred.resolve(event.data.outputFilePath);
              unregisterJob(jobID);
              break;
          }
        }
      }

      if (adobeService.isHostAvailable()) {
        adobeService.registerEventListener('se.codemill.ppro.RenderEvent', handleRenderEvent);
      }

      function runWithActiveSequenceCheck(callOpts) {
        if (adobeService.isHostAvailable()) {
          var deferred = $q.defer();
          adobeService.callCS(getActiveSequence())
            .then(function (sequence) {
              if (typeof sequence === 'undefined' || sequence === null || sequence.id === "" || sequence.name === "name") {
                deferred.reject(new Error('No active sequence : 11'));
              } else {
                adobeService.callCS(callOpts)
                  .then(function (data) {
                    deferred.resolve(data);
                  })
                  .catch(function (error) {
                    deferred.reject(error);
                  });
              }
            })
            .catch(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        } else {
          return $q.when();
        }
      }
      this.renderActiveSequence = function (config, useInOutPoints) {
        var deferred = $q.defer();
        var outputPath = adobeService.getFilePath(config.output);
        var presetPath = adobeService.getFilePath(config.preset);
        if (!adobeService.isHostAvailable()) {
          var iteration = 0;
          var iterationFunc = function () {
            if (iteration >= 10) {
              deferred.resolve(outputPath + 'test.mp4');
            } else {
              deferred.notify(iteration * 10);
              iteration += 1;
              $timeout(iterationFunc, 250);
            }
          };
          $timeout(iterationFunc, 250);
        } else {
            runWithActiveSequenceCheck(renderSequence(presetPath, outputPath, useInOutPoints))
            .then(function(jobID) {
              registerJob(jobID, deferred);
            })
            .catch(function(error) {
              deferred.reject(error);
            });
        }
        return deferred.promise;
      };

      this.clearSequenceMarkers = function () {
        return runWithActiveSequenceCheck(clearSequenceMarkers());
      };
       
      this.isInMarkerActive = function() {
          adobeService.callCS(getInMarkerPoint()).then(function(point) {
              try {
                  if (typeof point !== "undefined" && point !== null && point > 0) {
                      $log.debug("PP isInMarkerActive true");
                      return true
                  }
              } catch (e) {
                  $log.Error(e);

              }
          }).catch(function(error) {
              $log.Error(error);
          });
          $log.debug("PP isInMarkerActive false");
          return false;
      }

      var resetMarkersEndIfInPointActive = function (markers) {
          adobeService.callCS(getInMarkerPoint()).then(function(point) {
              try {
                  if (typeof point !== "undefined" && point !== null && point > 0 && markers.length > 0) {
                      for (var i = 0; i < markers.length; i++) {
                          markers[i].start = (markers[i].start) + parseFloat(point);
                          markers[i].end = (markers[i].end + parseFloat(point));
                      }
                  }
              } catch (e) {
                  $log.Error(e);
              } 
          }).catch(function(error) {
              $log.Error(error);
          })
        };

      this.createSequenceMarkers = function (markers) {
          $log.debug('markers: ', markers)
          resetMarkersEndIfInPointActive(markers);
        return runWithActiveSequenceCheck(createSequenceMarkers(markers));
      };

      var guid = function () {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
      };

      this.getActiveSequence = function () {
        if (adobeService.isHostAvailable()) {
          return adobeService.callCS(getActiveSequence());
        } else {
          return $q.when({
            'id': guid(),
            'name': 'Sequence name'
          });
        }
      };

    }]);