
document.addEventListener('DOMContentLoaded', () => {
    // Load templates
    const template_names = Handlebars.compile(document.querySelector('#names-template').innerHTML);
    const template_buttons = Handlebars.compile(document.querySelector('#button-template').innerHTML);
    const template_result = Handlebars.compile(document.querySelector('#result-template').innerHTML);

    // Create name input fields
    function createClassNames(amount_classes) {
        document.querySelector("#class-names").innerHTML = template_names({ "i": 1 });
        var i;
        for (i = 0; i < (amount_classes - 1); i++) {
            document.querySelector("#class-names").innerHTML += template_names({ "i": i + 2 });
        }
    }

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

        // Create class name input fields
        createClassNames(amount_classes);

        // Create buttons
        createClassButton(amount_classes);

        // Reinstantiate the CNN model
        //labelname();
        cnn_app();
    };

    function labelname() {

        const names = document.querySelectorAll(".class-name");

        for (let index = 0; index < names.length; index++) {
            const element = names[index].value;
            console.log(element);

        }

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

        // Load the model.
        console.log('Loading mobilenet..');
        net = await mobilenet.load();
        console.log('Sucessfully loaded model');

        // Load webcam
        await setupWebcam();

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

        while (false) {
            if (classifier.getNumClasses() > 0) {

                const names = document.querySelectorAll(".class-name");

                // Get the activation from mobilenet from the webcam.
                const activation = net.infer(webcamElement, 'conv_preds');
                // Get the most likely class and confidences from the classifier module.
                const result = await classifier.predictClass(activation);

                // Get results (Predicted class and Probability)
                const prediction = names[result.classIndex].value;
                const probability = result.confidences[result.classIndex] * 100;

                document.querySelector("#result").innerHTML = template_result({ "prediction": prediction, "probability": probability });

            }

            await tf.nextFrame();
        }
    }


    // Launch the webapp
    let amount_classes = document.querySelector("#amount-classes").value;
    /// Create class name input fields
    createClassNames(amount_classes);
    /// Create class buttons
    createClassButton(amount_classes);

    /// Create result section
    document.querySelector("#result").innerHTML = template_result({ "prediction": "-", "probability": "-" });

    /// Launch camera
    setupWebcam();

    /// Launch CNN
    cnn_app();

});