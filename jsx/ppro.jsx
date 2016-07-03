//Common
var HIGH_TEMPLATE = "High";
var MEDIUM_TEMPLATE = "Medium";
var LOW_TEMPLATE = "Low";

function replaceEscapedCharacters(comment) {

    comment = comment.replace(/<br\s*[\/]?>/gi, '\n');

    comment = comment.replace(/&#39;/g, "'");
    comment = comment.replace(/&#;39;/g, "'");
    comment = comment.replace(/&%23;39;/g, "'");
    comment = comment.replace(/&&%23;37;23;39;/g, "'");

    comment = comment.replace(/&#47;/g, "/");
    comment = comment.replace(/&#;47;/g, "/");
    comment = comment.replace(/&%23;47;/g, "/");

    comment = comment.replace(/&#92;/g, "\\");
    comment = comment.replace(/&#;92;/g, "\\");
    comment = comment.replace(/&%23;92;/g, "\\");

    comment = comment.replace(/&#34;/g, "\"");
    comment = comment.replace(/&#;34;/g, "\"");
    comment = comment.replace(/&%23;34;/g, "\"");
    comment = comment.replace(/&&%23;37;23;34;/g, "\"")

    comment = comment.replace(/&#37;/g, "%");
    comment = comment.replace(/&#;37;/g, "%");
    comment = comment.replace(/&%23;37;/g, "%");

    comment = comment.replace(/%20/g, " ");
    comment = comment.replace(/%0A/g, " ");
    return comment;
};

function hasTemplateAlreadyInstalled(name, templates) {
    var hasTemplateInstalled = false;
    for (var i = 1; i < templates.length; i++) {
        if (templates[i] === name) {
            hasTemplateInstalled = true;
        };
    }
    return hasTemplateInstalled;
};

function hasAllWipsterTemplatesInstalled(templates) {
    var hasHighTemplateInstalled = hasTemplateAlreadyInstalled(HIGH_TEMPLATE, templates);
    var hasMedTemplateInstalled = hasTemplateAlreadyInstalled(MEDIUM_TEMPLATE, templates);
    var hasLowTemplateInstalled = hasTemplateAlreadyInstalled(LOW_TEMPLATE, templates);

    return hasHighTemplateInstalled && hasMedTemplateInstalled && hasLowTemplateInstalled;
};

function addWipsterTemplates(presetPath, currentTemplates) {
   // var activeSequence = app.project.activeItem;
    
    var currentProjectFile = app.project.file;
    app.project.save();

    var my_file = new File(presetPath);
   // $.writeln("myfile: ", my_file);
    app.open(my_file);
    if (my_file.exists){
        app.open(my_file);
       // $.writeln("is open");
        var renderQueue = app.project.renderQueue;

        var activeSequence = app.project.item(1);
        var rqItem = app.project.renderQueue.items.add(activeSequence);

        if(renderQueue.numItems > 0) {
            /*
            var qItem = renderQueue.item(1);
            var templateCount = qItem.templates.length;
            $.writeln("temp length: ", templateCount);

            for (var k = 0; k <= templateCount; ++k) {
                var template = qItem.templates[k];
                $.writeln("template: ", template);
                $.writeln("k: ", k);
                qItem.saveAsTemplate(template);
            }*/
            for (var i = 1; i <= renderQueue.numItems; ++i) {
                var qItem = renderQueue.item(i);
                //output modules
                for (var j = 1; j <= qItem.numOutputModules; ++j) {
                    var om = qItem.outputModule(j);
                    
                    if ((om.name === HIGH_TEMPLATE && !hasTemplateAlreadyInstalled(HIGH_TEMPLATE, currentTemplates)) ||
                            (om.name === MEDIUM_TEMPLATE && !hasTemplateAlreadyInstalled(MEDIUM_TEMPLATE, currentTemplates)) ||
                                (om.name === LOW_TEMPLATE && !hasTemplateAlreadyInstalled(LOW_TEMPLATE, currentTemplates))) { //todo make this a reuseable function

                        om.saveAsTemplate(om.name);
                    };
                }
            }
        };

        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        app.open(currentProjectFile);
    };
};

function removeAllQueuedRenderItems() {
    var renderQueue = app.project.renderQueue;
    if(renderQueue.numItems > 0) {
        for (var i = 1; i <= renderQueue.numItems; ++i) {
            var rqItem = renderQueue.item(i);

            rqItem.remove();
        }
    };
    app.project.save();
};

//function removeInstalledWipsterTemplates(rqItem) {
//    var currentTemplates = rqItem.outputModule(1).templates;

//    for (var i = 1; i < currentTemplates.length; i++) {
//        var template = currentTemplates[i];
//        if (template === "High" || template === "Medium" || template === "Low") {
//           // rqItem.outputModule(1).templates[i].remove();
//            rqItem.outputModule(1).remove();
//        }
//    }
//};

function getRenderTemplates() {

    var activeSequence = app.project.activeItem;

    removeAllQueuedRenderItems();

    var rqItem = app.project.renderQueue.items.add(activeSequence);
    rqItem.render = false;

    rqItem = app.project.renderQueue.item(1);
    var templates = rqItem.templates;

    rqItem.remove();
    app.project.save();
    return JSON.stringify(templates);
};

function getOutputTemplates(presetPath) {

    var activeSequence = app.project.activeItem;

    removeAllQueuedRenderItems();

    var rqItem = app.project.renderQueue.items.add(activeSequence);
    rqItem.render = false;
    var currentTemplates = rqItem.outputModule(1).templates;

    if (typeof presetPath !== "undefined" && presetPath !== null && !hasAllWipsterTemplatesInstalled(currentTemplates)) {
        addWipsterTemplates(presetPath, currentTemplates);
    };
    
    rqItem = app.project.renderQueue.item(1);
    var templates = rqItem.outputModule(1).templates;

    rqItem.remove();
    app.project.save();
    return JSON.stringify(templates);
};

//AE
function renderItem(outputPath, outputTemplate, renderTemplate) {

    var activeSequence = app.project.activeItem;
    if (activeSequence != undefined) {

        app.project.save();

        //var total = activeSequence.workAreaDuration * activeSequence.frameRate;

        var rqItem = app.project.renderQueue.items.add(activeSequence);

        rqItem.applyTemplate(renderTemplate);  //Best Settings Draft Settings

        var outPutFileName = calculateOutputFilenameForAE(outputPath, activeSequence, '');

        var file = new File(outPutFileName);

        rqItem.outputModule(1).file = file;

        rqItem.outputModule(1).applyTemplate(outputTemplate);
        rqItem.render = true;
        
        app.project.renderQueue.render(); //Triggers render inside AE.

        return rqItem.outputModule(1).file;
    }

    return null;
}

function setCurrentTimeIndicator(time) {
    app.project.activeItem.time = time
}

function getActiveItem() {
    var data = {
        id: null,
        name: null
    };
    var activeItem = app.project.activeItem;

   
    if (activeItem && activeItem.typeName === "Composition") {

        data = {
            'id': activeItem.id,
            'name': activeItem.name
        };
    };

    if (typeof JSON !== 'object' && activeItem) {
        return '{"id":"' + activeItem.id + '","name": "' + activeItem.name + '"}'
    };

    if (typeof JSON === "object" && activeItem) {
        return JSON.stringify(data);
    }
    return '{"id":"0","name": ""}'
}

function setNullLayerMarkers(data) {

    if (!app.project.activeItem || !app.project.activeItem.layers) {
        return
    }

    var nullLayer = app.project.activeItem.layer("Wipster comments");

    if (nullLayer != null) {
        nullLayer.locked = false;
        nullLayer.remove();
    }

    nullLayer = app.project.activeItem.layers.addNull();
    nullLayer.name = "Wipster comments";
   
    var json;

    if (typeof JSON !== 'object') {
        json = Function("return " + data + "")();
    } else {
        json = JSON.parse(data);
    }
    for (var i = 0; i < json.length; i++) {
        var AllCommentsAtThisTime = "";
        for (var c = 0; c < json[i].comments.length; c++) {
            AllCommentsAtThisTime  += "(" + (c + 1) + ") " + json[i].comments[c]
        }
        var myMarker = new MarkerValue(replaceEscapedCharacters(AllCommentsAtThisTime));
        myMarker.duration = 1;
        nullLayer.property("Marker").setValueAtTime(json[i].start[0], myMarker);
    }

    nullLayer.locked = true;
}

//PPRO
function renderSequence(presetPath, outputPath, useInOutPoints) {
  app.enableQE();
  var jobID = undefined;

  var activeSequence = qe.project.getActiveSequence();
  if (activeSequence != undefined) {

    app.encoder.launchEncoder();

    function onEncoderJobComplete(jobID, outputFilePath) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "se.codemill.ppro.RenderEvent";
      if (typeof JSON !== 'object') {
          var filePath = encodeURI(outputFilePath);
          eventObj.data = '{"type": "complete","jobID": "' + jobID + '","outputFilePath": "' + filePath + '"}';
      } else {
          eventObj.data = JSON.stringify({
              'type': 'complete',
              'jobID': jobID,
              'outputFilePath': outputFilePath
          });
      }

      eventObj.dispatch();
    }

    function onEncoderJobError(jobID, errorMessage) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "se.codemill.ppro.RenderEvent";
      if (typeof JSON !== 'object') {
          eventObj.data = '{"type": "error","jobID": "' + jobID + '","errorMessage": "' + errorMessage + '"}';
      } else {
          eventObj.data = JSON.stringify({
              'type': 'error',
              'jobID': jobID,
              'errorMessage': errorMessage
          });
      }

      eventObj.dispatch();
    }

    function onEncoderJobProgress(jobID, progress) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "se.codemill.ppro.RenderEvent";

      if (typeof JSON !== 'object') {
          eventObj.data = '{"type": "progress","jobID": "' + jobID + '","progress": "' + progress +'"}';
      } else {
          eventObj.data = JSON.stringify({
              'type': 'progress',
              'jobID': jobID,
              'progress': progress
          });
      }
      eventObj.dispatch();
    }

    function onEncoderJobQueued(jobID) {
      app.encoder.startBatch();
    }

    function getEncodeSectionDescription(useInOutPoints) {
        if (useInOutPoints && useInOutPoints === "true")
        {
            return app.encoder.ENCODE_IN_TO_OUT
        }
        return app.encoder.ENCODE_ENTIRE;
    }

    var projPath = new File(app.project.path);

    var seqInPoint = app.project.activeSequence.getInPoint();	
    var seqOutPoint = app.project.activeSequence.getOutPoint();	

    if (outputPath == undefined) {
      outputPath = Folder.selectDialog("Choose the output directory").fsName;
    }

    if (outputPath != null && projPath.exists) {
      var outputPresetPath = getPresetPath(presetPath);
      var outPreset = new File(outputPresetPath);
      if (outPreset.exists == true) {

        var outputFormatExtension = activeSequence.getExportFileExtension(outPreset.fsName);

        if (outputFormatExtension != null) {
          var fullPathToFile = calculateOutputFilename(outputPath, activeSequence, outputFormatExtension);

          app.encoder.bind('onEncoderJobComplete', onEncoderJobComplete);
          app.encoder.bind('onEncoderJobError', onEncoderJobError);
          app.encoder.bind('onEncoderJobProgress', onEncoderJobProgress);
          app.encoder.bind('onEncoderJobQueued', onEncoderJobQueued);

          // use these 0 or 1 settings to disable some/all metadata creation.

          app.encoder.setSidecarXMPEnabled(0);
          app.encoder.setEmbeddedXMPEnabled(0);

          jobID = app.encoder.encodeSequence(app.project.activeSequence,
            fullPathToFile,
            outPreset.fsName,
            getEncodeSectionDescription(useInOutPoints));
          outPreset.close();
           }
      } else {
        alert("Could not find output preset.");
      }
    } else {
      alert("Could not find/create output path.");
    }
    projPath.close();
  }

  return jobID;
}

function getActiveSequence() {
  var data = {
    id : null,
    name : null
  };
  app.enableQE();
  var activeSequence = qe.project.getActiveSequence();
  if (activeSequence) {
    data = {
      'id': activeSequence.guid,
      'name': activeSequence.name
    };
  }
  if (typeof JSON !== 'object' && activeSequence)
  {
      return '{"id":"' + activeSequence.guid + '","name": "' + activeSequence.name + '"}'
  }
  return JSON.stringify(data);
}

function calculateOutputFilename(outputPath, activeSequence, extension) {
  return outputPath + getPathSeparatorByOS() + activeSequence.name + "." + extension;
}

//todo duplicate
function calculateOutputFilenameForAE(outputPath, activeSequence, extension) {
    
    return outputPath + getPathSeparatorByOSForAE() + activeSequence.name + "/";
}
//todo duplicate
function getPathSeparatorByOSForAE() {
   // $.writeln("Folder: ", Folder);
    //if (Folder === undefined || Folder === null || Folder.fs === undefined || Folder.fs === null) {
    //    return '\\';
    //}
    //$.writeln("Folder: ", Folder.fs);
    //if (Folder.fs === 'Macintosh') {
        return '/';
    //} else {
    //    return '\\';
    //}

}

function getPathSeparatorByOS() {
  app.enableQE();
  if (qe === undefined || qe === null || qe.project === undefined || qe.project === null) {
    return;
  }

  if (qe.platform !== undefined && qe.platform === 'Macintosh') {
    return '/';
  } else {
    return '\\';
  }
}

function loadPluginLib() {
  var eoName;
  if (Folder.fs == 'Macintosh') {
    eoName = "PlugPlugExternalObject";
  } else {
    eoName = "PlugPlugExternalObject.dll";
  }

  try {
    new ExternalObject('lib:' + eoName);
  } catch (error) {
    alert(error);
  }
}

function getPresetPath(presetPath) {
  if (presetPath != null) {
    return presetPath;
  }
  if (Folder.fs == 'Macintosh') {
    return "/Applications/Adobe\ Premiere\ Pro\ CC\ 2015/Adobe\ Premiere\ Pro\ CC\ 2015.app/Contents/MediaIO/systempresets/58444341_4d584658/XDCAMHD\ 50\ NTSC\ 60i.epr";
  } else {
    return "C:\\Program Files\\Adobe\\Adobe Media Encoder CC 2015\\MediaIO\\systempresets\\58444341_4d584658\\XDCAMHD 50 NTSC 60i.epr";
  }
}

function clearSequenceMarkers() {
  if (app.project.activeSequence != undefined) {
    var ms = [];
    var markers = app.project.activeSequence.markers;
    for(var current_marker = 	markers.getFirstMarker();
        current_marker !=	undefined;
        current_marker =	markers.getNextMarker(current_marker)){
      ms.push(current_marker);
    }
    for (var i = 0; i < ms.length; i++) {
      markers.deleteMarker(ms[i]);
    }
  }
}

function createSequenceMarkers(inMarkers) {

  if (typeof app.project.activeSequence != "undefined" && typeof inMarkers != "undefined") {
      var json;
      if (typeof JSON !== 'object')
      {
          json = Function("return " + inMarkers + "")();
      } else {
          json = JSON.parse(inMarkers);
      }

      for (var i = 0; i < json.length; i++) {
          createSequenceMarker(json[i])
    }
  }
}



function createSequenceMarker(marker) {
    var sequenceMarkers = app.project.activeSequence.markers;
    var newMarker = sequenceMarkers.createMarker(marker.start);
    newMarker.name = marker.name;

    newMarker.comments = replaceEscapedCharacters(marker.comments);

    newMarker.end = marker.end;
    
    if(typeof marker.completed !== "undefined" && marker.completed === true)
    {
        newMarker.type = "Segmentation";
    }
    //newMarker.type = getMarkerColour(index);
}

function getPathAsFile(path) {
  var file = new File(path);
  return file;
}

function getMarkerColour(index) {

    if (index === 1)
    {
        return "Segmentation";
    }
    if (index === 2) {
        return "Chapter";
    }
    if (index === 3) {
        return "WebLink";
    }
    return "Comment";
}

function getInMarkerPoint() {
    return app.project.activeSequence.getInPoint();
}

function setPlayerPosition(ticks) {
    if (app.project.activeSequence != undefined) {
        app.project.activeSequence.setPlayerPosition(ticks);
    }
}

function setPlayerPositionToMarker(time) {

    if (app.project.activeSequence != undefined) {
        var markers = app.project.activeSequence.markers;
        for (var current_marker = markers.getFirstMarker() ;
            current_marker != undefined;
            current_marker = markers.getNextMarker(current_marker)) {

            if (current_marker.end.seconds == time)
            {
                setPlayerPosition(current_marker.end.ticks)
            }
        }
    }
}
//var colourCounter = 1;
  //    for (var i = 0; i < json.length; i++) {
   //       if (i % 4 == 0)
   //       {
    //          colourCounter = 1
    //      }
    //      createSequenceMarker(json[i], colourCounter)
    //      colourCounter++;
   // }