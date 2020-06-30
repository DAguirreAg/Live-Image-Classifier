
document.addEventListener('DOMContentLoaded', () => {
    // Load templates
    const template_buttons = Handlebars.compile(document.querySelector('#button-template').innerHTML);
    const template_result = Handlebars.compile(document.querySelector('#result-template').innerHTML);

    // Create buttons
    function createClassButton(amount_classes) {

        document.querySelector("#classes").innerHTML = template_buttons({ "i": 1 });

        var i;
        for (i = 0; i < (amount_classes - 1); i++) {
            document.querySelector("#classes").innerHTML += template_buttons({ "i": i + 2 });
        }

    }

    // Create class buttons when amount changes
    document.querySelector("#amount-classes").onchange = () => {

        let amount_classes = document.querySelector("#amount-classes").value;

        // Create buttons
        createClassButton(amount_classes);

        // Reinstantiate the CNN model
        cnn_app();
    };

    const webcamElement = document.getElementById('webcam');
    async function setupWebcam() {
        return new Promise((resolve, reject) => {
            const navigatorAny = navigator;
            navigator.getUserMedia = navigator.getUserMedia ||
                navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
                navigatorAny.msGetUserMedia;
            if (navigator.getUserMedia) {
                navigator.getUserMedia({ video: true },
                    stream => {
                        webcamElement.srcObject = stream;
                        webcamElement.addEventListener('loadeddata', () => resolve(), false);
                    },
                    error => reject());
            } else {
                reject();
            }
        });
    }

    // Setup webcam and model
    const classifier = knnClassifier.create();
    let net;

    async function cnn_app() {

        const class_buttons = document.querySelectorAll(".cnn-class");

        await setupWebcam();

        // Load the model.
        console.log('Loading mobilenet..');
        net = await mobilenet.load();
        console.log('Sucessfully loaded model');


        // Reads an image from the webcam and associates it with a specific class
        // index.
        const addExample = classId => {
            // Get the intermediate activation of MobileNet 'conv_preds' and pass that
            // to the KNN classifier.
            const activation = net.infer(webcamElement, 'conv_preds');

            // Pass the intermediate activation to the classifier.
            classifier.addExample(activation, classId);
        };

        // When clicking a button, add an example for that class.

        // Add event listener to each button
        for (let i = 0; i < class_buttons.length; i++) {
            class_buttons[i].addEventListener('click', () => {
                class_buttons[i].addEventListener('click', () => addExample(i));
            });
        };

        while (true) {
            if (classifier.getNumClasses() > 0) {
                // Get the activation from mobilenet from the webcam.
                const activation = net.infer(webcamElement, 'conv_preds');
                // Get the most likely class and confidences from the classifier module.
                const result = await classifier.predictClass(activation);

                // Get results (Predicted class and Probability)
                const prediction = result.classIndex;
                const probability = result.confidences[result.classIndex] * 100;

                document.querySelector("#result").innerHTML = template_result({ "prediction": prediction, "probability": probability });

            }

            await tf.nextFrame();
        }
    }

    
    // Launch the webapp
    /// Create class buttons
    let amount_classes = document.querySelector("#amount-classes").value;
    createClassButton(amount_classes);
    /// Launch camera
    setupWebcam();
    /// Launch CNN
    cnn_app();

});