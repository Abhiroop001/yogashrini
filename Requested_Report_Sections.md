# Yogashrini Project Report Sections

## Requested Content Index

| Sl. No. | Content | Page No. |
|---:|---|---:|
| 5 | Abstract | 5 |
| 9 | Introduction | 9-10 |
| 10 | Literature Review | 11-12 |
| 11 | Objectives | 13 |
| 12 | Problem Statement | 14 |
| 13 | Key Features of the System | 15 |
| 14 | Significance of the Project | 16 |
| 15 | Technical Approach | 16-19 |
| 16 | Dataset Overview | 20-21 |
| 17 | Result and Discussion | 22-24 |
| 18 | Future Work | 25-26 |
| 19 | Conclusion | 26 |
| 20 | References | 27 |

<div style="page-break-after: always;"></div>

## 5. Abstract

Yogashrini is an intelligent yoga learning and wellness platform that combines modern web technologies with deep learning based posture recognition. The project is designed around the idea that digital yoga platforms should not be limited to static videos or generic course pages. A learner practicing from home often requires three things at the same time: structured guidance, safe access to learning material, and a method of checking whether a yoga posture is being performed correctly. Yogashrini addresses these needs by integrating a React based frontend, a Node.js and Express.js backend, a MongoDB database, a Flask based artificial intelligence service, and a TensorFlow EfficientNetB0 model trained to classify yoga postures from images.

The system provides a complete user experience for yoga learners. Users can view the Yogashrini dashboard, browse yoga classes, understand different yoga types, explore retreats, enroll in structured video courses, watch weekly course lessons, complete weeks, earn XP and bonus points, and unlock bonus learning material. The application also supports user registration and login, course enrollment, payment handling through Razorpay, and an AI chatbot connected through the backend using the OpenRouter chat completion API. On the administrative side, the project includes a separate admin interface for managing courses, products, retreats, thumbnails, course weeks, and video content.

The most technically significant part of the project is the AI posture detection module. The Python backend loads a trained EfficientNetB0 based image classification model using TensorFlow and Keras. The model accepts a user-uploaded yoga image, resizes it to 224 x 224 pixels, performs inference, and returns the predicted yoga pose along with a confidence score, top-5 predictions, and an annotated output image. The model recognizes 47 yoga asanas including Adho Mukha Svanasana, Bakasana, Balasana, Padmasana, Trikonasana, Virabhadrasana variants, Vrksasana, and many others. The local dataset contains 2,756 yoga images distributed across these 47 classes. Training and evaluation artifacts stored in the project include model weights, class names, training history plots, confusion matrix images, per-class accuracy plots, prediction grids, and dataset distribution visualizations.

The EfficientNetB0 architecture was selected because it provides a strong balance between accuracy and computational efficiency. Compared with heavier convolutional models, EfficientNetB0 is suitable for deployment in a web-connected inference service because it can use ImageNet transfer learning, a compact input size, and a lighter model footprint while still producing practical multi-class classification performance. In the implemented backend, the model architecture uses EfficientNetB0 without its original top layer, followed by global average pooling, a dense layer with 512 units, batch normalization, dropout, and a final softmax output layer for 47 classes. The saved backend health route reports approximately 84.96 percent accuracy, and the frontend displays the AI detector as a 47-pose classifier trained on 2,756 samples.

Yogashrini is therefore not only a yoga website but a combined learning management system, wellness application, AI inference tool, and content administration platform. Its contribution lies in showing how traditional yoga education can be enhanced through machine learning and full-stack web deployment. By connecting image based posture recognition with course progress tracking, secure enrollment, interactive learning, chatbot support, and admin management, the project creates a practical model for future digital wellness systems.

<div style="page-break-after: always;"></div>

## 9. Introduction

Yoga is one of the oldest and most widely practiced systems for improving physical health, mental balance, flexibility, breathing awareness, and emotional well-being. In recent years, yoga has moved strongly into digital spaces. Learners now use mobile applications, YouTube videos, live sessions, recorded lessons, and online courses to practice yoga from home. Although this shift has improved accessibility, it has also created a new problem: most online yoga systems provide content but do not verify whether the learner is performing the posture correctly. A beginner may watch a video and imitate a pose, but without feedback the person may unknowingly practice with poor alignment, incomplete posture, or unsafe body positioning.

This project, Yogashrini, was developed to reduce that gap between online yoga instruction and intelligent feedback. The project combines two major domains: web based learning and artificial intelligence based yoga posture recognition. On one side, Yogashrini acts as a responsive yoga learning platform with pages for the dashboard, about section, classes, training, retreats, contact, yoga types, courses, course details, and weekly video lessons. On the other side, it provides an AI Yoga Pose Detector where the user can upload a yoga image and immediately receive the predicted asana name, a confidence score, ranked top-5 alternatives, and an annotated result image.

The project follows a practical full-stack architecture. The frontend is built using React and React Router. It provides a single page application experience, structured navigation, forms, course cards, progress interfaces, and an upload panel for AI posture detection. The main backend is built using Node.js, Express.js, MongoDB, and Mongoose. It manages user authentication, course records, week records, product data, retreat data, admin login, file upload, video serving, enrollment status, weekly completion, XP and points, and Razorpay payment verification. A separate Python Flask backend is responsible for artificial intelligence inference. This separation is useful because the machine learning model uses TensorFlow and Keras, while the business backend uses JavaScript and MongoDB.

The system includes two main server endpoints from an architectural point of view. The Express server runs on port 2000 and manages the platform features such as courses, payments, users, admin, retreats, products, and chatbot communication. The Flask AI server runs on port 5000 and exposes routes such as `/health`, `/predict`, and `/classes`. The React posture detector sends image data to the Flask `/predict` endpoint as a base64 data URL. The backend decodes the image, converts it to RGB, resizes it, performs EfficientNetB0 inference, prepares top-5 class probabilities, draws the prediction result on an image copy, and sends the result back to the frontend as JSON.

The project is also designed as a learning management system. A user can browse available courses, search by title, filter by level such as Beginner, Intermediate, or Advanced, inspect the course details, view the number of weeks, see XP rewards, enroll in free or paid courses, and continue learning through a weekly video player. The course player contains a sidebar for course outline, progress bars, completed week indicators, bonus content indicators, XP display, and next/previous navigation. Completion of a week updates the enrollment record and awards XP and bonus points. When all regular weeks are completed, the system can unlock bonus content.

Another important part of the project is administrative control. The admin panel includes pages for adding and editing courses, products, and retreats, listing records, managing course weeks, and uploading video files. The backend supports thumbnail uploads and video uploads through express-fileupload and stores media inside the public directory so that the frontend can access videos and thumbnails through static routes.

Yogashrini is therefore a realistic project because it does not stop at model training. Many machine learning projects remain limited to notebooks, but this project connects the model with a web application that a user can actually operate. The dataset scripts, notebooks, saved model files, Flask backend, React UI, Express routes, database schemas, and admin panel together form a complete pipeline from dataset preparation to user-facing inference.

<div style="page-break-after: always;"></div>

## 10. Literature Review

The development of Yogashrini is influenced by research and technology trends in computer vision, transfer learning, yoga pose recognition, web based learning systems, and digital payment enabled platforms. Automated yoga posture recognition has generally followed two major approaches. The first approach uses image-level classification, where a full image is given to a convolutional neural network and the model predicts the posture class. The second approach uses pose estimation or skeleton based methods, where the human body is represented as keypoints and angles are analyzed to determine posture correctness. Both approaches have strengths and limitations.

Image-level CNN based recognition is useful when the goal is to classify the overall pose category from a static image. In this approach, the model learns patterns such as body outline, limb arrangement, orientation, background-independent visual cues, and posture-specific shapes. Transfer learning has become especially important for this type of work because yoga datasets are usually much smaller than large-scale image datasets. A model pre-trained on ImageNet already understands generic visual features such as edges, textures, curves, and object parts. Fine-tuning such a model on yoga images reduces the amount of data and training time required.

EfficientNet is one of the most important CNN families for this project. Tan and Le introduced EfficientNet as a family of convolutional models that use compound scaling to balance depth, width, and input resolution. The key idea is that model scaling should not arbitrarily increase only one dimension. Instead, EfficientNet scales multiple dimensions in a balanced way, producing strong accuracy with fewer parameters and lower computational cost. EfficientNetB0 is the baseline model in this family and is widely used in transfer learning tasks because it provides a good balance between performance and efficiency. This makes it suitable for Yogashrini, where the model must be accurate enough for multi-class posture recognition but light enough to be served through a web API.

The TensorFlow Keras implementation of EfficientNetB0 allows developers to instantiate the architecture with ImageNet weights, remove the original classification head, and attach a custom output layer. This is exactly the pattern used in Yogashrini. The Python backend rebuilds EfficientNetB0 with `include_top=False`, applies global average pooling, adds dense and regularization layers, and ends with a 47-class softmax output. This design follows standard transfer learning practice.

Skeleton based yoga recognition systems also appear frequently in literature. Tools such as OpenPose, PoseNet, MediaPipe, and MoveNet can extract body joints from an image or video. These methods are valuable for correction because joint angles can be measured and compared with ideal posture templates. However, skeleton methods may face problems when a body part is hidden, when the user wears loose clothing, when the image is captured from an unusual angle, or when complex yoga poses cause self-occlusion. Yogashrini currently focuses on image-level classification, but its backend has a placeholder for future keypoint integration, showing that the system can later evolve toward hybrid classification plus correction.

Full-stack digital learning systems also influence this project. A modern e-learning platform should provide more than content listing. It should support authentication, progress tracking, user-specific enrollment, video playback, rewards, structured curriculum, and admin controlled content updates. Yogashrini uses React for the frontend because React enables component based development, route based navigation, reusable UI components, and state-driven interfaces. React Router is used to define pages such as login, dashboard, courses, course detail, week player, posture detection, training, retreat, and contact.

Express.js and MongoDB are used because they are well suited to REST-style APIs and document-oriented data. Express routing allows the system to define separate route modules for users, courses, payments, retreats, products, and admins. Mongoose schemas define the structure of documents such as Course, Week, Enrollment, User, Admin, Product, and Retreat. This makes the backend maintainable because each data type has a defined model and each feature has its own controller.

Payment gateway integration is another important area. Razorpay provides order creation, payment collection, and payment verification flows. In Yogashrini, paid course enrollment starts by creating an order, then the frontend opens Razorpay checkout, and the backend verifies the payment signature before marking the enrollment as paid. This is a realistic commercial feature because it connects learning content with secure paid access.

Finally, AI chatbot integration reflects the growing role of conversational assistance in learning systems. Yogashrini includes a chatbot button in the frontend and a `/chat` endpoint in the Express backend. The backend forwards user messages to OpenRouter's chat completion API and returns the assistant response to the frontend. This makes the platform more interactive because users can ask yoga or wellness-related questions without leaving the website.

In summary, the literature and technology background of Yogashrini supports four important decisions: using EfficientNetB0 for efficient transfer learning, using a separate Flask backend for model inference, using a MERN architecture for the web platform, and using payment and chatbot APIs to make the application complete and practical.

<div style="page-break-after: always;"></div>

## 11. Objectives

The main objective of Yogashrini is to create an intelligent, accessible, and feature-rich yoga learning platform that combines structured digital education with AI based posture recognition. The project is not limited to building a static yoga website. It aims to build a complete system where users can learn, enroll, practice, track progress, receive AI feedback, and interact with a wellness assistant.

The specific objectives are:

1. To design and develop a responsive React based frontend for yoga learners with pages for dashboard, about, classes, training, retreats, contact, yoga types, courses, course details, weekly video lessons, login, and AI posture detection.

2. To implement an AI Yoga Pose Detector that accepts user-uploaded images and predicts the yoga asana using a trained EfficientNetB0 deep learning model.

3. To classify 47 yoga posture classes using a TensorFlow/Keras model trained on a 2,756-image yoga dataset.

4. To provide prediction confidence and top-5 class probabilities so that users can understand not only the model's best answer but also its alternative predictions.

5. To generate an annotated prediction image where the detected pose and confidence are visually displayed on the uploaded image.

6. To build a Flask based AI backend that can load model weights, expose a health route, return class names, and perform prediction through an API endpoint.

7. To build a Node.js and Express.js backend for business logic, including users, admins, courses, weeks, enrollments, products, retreats, payments, and chatbot communication.

8. To design MongoDB/Mongoose schemas for structured storage of user data, course data, weekly video data, enrollment progress, payment status, and admin-managed content.

9. To implement secure user registration and login using password hashing and JWT based authentication.

10. To implement admin login and admin content management features so that courses, retreats, products, thumbnails, and videos can be added and updated.

11. To integrate Razorpay payment handling for paid course enrollment, including order creation, payment verification, and enrollment confirmation.

12. To support free course enrollment without payment while still creating a valid enrollment record for progress tracking.

13. To implement a course learning flow where users can watch weekly videos, mark weeks complete, earn XP, gain bonus points, and unlock bonus content.

14. To integrate a chatbot using OpenRouter so that users can ask questions and receive conversational support inside the platform.

15. To create a system that can be expanded in the future with real-time webcam posture correction, keypoint based analysis, personalized recommendations, and mobile deployment.

<div style="page-break-after: always;"></div>

## 12. Problem Statement

The problem addressed by Yogashrini is the lack of intelligent, structured, and feedback-driven yoga learning platforms for home users. Most online yoga solutions provide recorded videos, live sessions, blogs, or subscription-based content, but they rarely provide a complete learning environment with posture recognition, course progress tracking, secure enrollment, admin content management, and interactive assistance in a single system.

When users practice yoga at home, they often face several practical problems. First, they may not know whether their posture resembles the intended asana. A beginner may confuse visually similar poses or perform a pose with incorrect alignment. Second, users may lack a structured learning path. Random videos do not always provide progressive learning from beginner to advanced levels. Third, platforms often fail to track progress in a motivating way. Without completion indicators, XP, points, or unlocked content, learners may lose consistency. Fourth, yoga instructors and administrators need a system to upload and manage courses, weeks, videos, retreats, and products without manually editing the website. Fifth, paid course platforms require reliable payment integration and enrollment verification.

The technical problem is also significant. A yoga posture recognition model must handle varied images, different body shapes, different camera angles, different backgrounds, different lighting conditions, and visually similar asanas. The model must be accurate enough to be useful, but efficient enough to run as a web-connected service. A heavy model may be difficult to deploy, while a very small model may not classify 47 postures properly. Therefore, the project needs a balanced architecture that combines an efficient CNN model with practical backend deployment.

Yogashrini solves this problem by designing a multi-component system:

- A React frontend for user interaction and learning.
- A Node/Express backend for platform logic and database communication.
- A MongoDB database for persistent records.
- A Flask/TensorFlow backend for AI inference.
- An EfficientNetB0 transfer learning model for yoga image classification.
- Razorpay integration for course payments.
- OpenRouter chatbot integration for conversational support.
- Admin panel for managing platform content.

Thus, the central problem statement can be written as:

To design and implement an intelligent yoga learning platform that enables users to learn yoga through structured courses, receive AI-based posture classification from uploaded images, track their learning progress, enroll securely in free or paid courses, and interact with a chatbot, while also allowing administrators to manage course and wellness content efficiently.

<div style="page-break-after: always;"></div>

## 13. Key Features of the System

Yogashrini contains a wide set of features that make it a complete digital yoga platform rather than a simple website.

### 13.1 AI Yoga Pose Detector

The posture detector is one of the main features. Users can upload a yoga image through the React frontend. The frontend compresses/resizes the image into a data URL and sends it to the Flask backend. The backend returns:

- Predicted pose label.
- Confidence score.
- Confidence percentage.
- Top-5 predictions.
- Annotated image.
- List of available classes through a separate classes endpoint.

The frontend displays the predicted asana, a color-coded confidence indicator, confidence bar, top-5 ranked results, and the annotated output image.

### 13.2 47-Class Yoga Recognition

The AI model recognizes 47 classical yoga asanas. This is much richer than small demo systems that classify only five or ten poses. The class list includes seated poses, standing poses, balancing poses, backbends, forward bends, inversions, and warrior pose variations.

### 13.3 EfficientNetB0 Transfer Learning

The model uses EfficientNetB0 with ImageNet weights and a custom classification head. The architecture includes:

- EfficientNetB0 convolutional base.
- Frozen lower layers during fine-tuning.
- GlobalAveragePooling2D.
- Dense layer with 512 units.
- BatchNormalization.
- Dropout of 0.5.
- 47-class softmax output.

### 13.4 User Dashboard

The dashboard introduces the Yogashrini Yoga School and highlights the platform's values, offerings, teacher training, facilities, teachers, and testimonials. It also shows key numbers such as 47 pose classes and connects users to training and contact pages.

### 13.5 Course Browsing and Filtering

Users can browse yoga courses, search by title, filter courses by level, view course thumbnails, see free or paid pricing, and inspect information such as course level, total weeks, XP rewards, and bonus content.

### 13.6 Course Detail and Enrollment

Each course has a detail page showing description, price, total weeks, instructor, level, curriculum, XP rewards, bonus weeks, and enrollment status. Users can enroll in free courses directly or initiate payment for paid courses.

### 13.7 Razorpay Payment Integration

For paid courses, the backend creates a Razorpay order and the frontend opens Razorpay checkout. After payment, the backend verifies the payment signature and marks enrollment as paid. This ensures that users cannot access paid content unless payment is verified.

### 13.8 Weekly Video Player

The WeekPlayer page provides structured learning. It loads the current course week, plays videos, shows the course outline, displays completion status, supports navigation to previous and next weeks, and allows users to mark a week as completed.

### 13.9 XP, Points, and Bonus Unlocking

When a user completes a week, the backend updates the enrollment record by adding XP and bonus points. If all regular weeks are completed, bonus content can be unlocked. This introduces gamification and encourages consistent learning.

### 13.10 Admin Panel

The admin application provides interfaces for adding, editing, listing, and managing courses, products, and retreats. The backend supports file uploads for thumbnails and videos.

### 13.11 Chatbot

The frontend includes a floating Yogashrini Assistant chatbot. Messages are sent to the Express backend, which forwards them to the OpenRouter chat completion API. The chatbot improves user engagement and provides instant support.

### 13.12 Authentication

The backend supports user registration, login, password hashing with bcrypt, JWT token creation, and a protected profile route. This allows user-specific course enrollments and progress tracking.

### 13.13 Database Driven Content

The system uses MongoDB with Mongoose schemas for users, admins, courses, weeks, enrollments, products, and retreats. This makes the platform dynamic and manageable.

<div style="page-break-after: always;"></div>

## 14. Significance of the Project

The significance of Yogashrini lies in its combination of artificial intelligence, web engineering, digital wellness, and practical deployment. Many academic machine learning projects end with a trained model and a notebook. Yogashrini goes further by connecting the model to a real web interface, a backend API, user workflows, course content, payments, and administration. This makes the project valuable from both a technical and social perspective.

From a technical perspective, the project demonstrates the complete life cycle of an AI-enabled web system. It includes dataset organization, model training, saved model weights, evaluation scripts, inference backend, REST API communication, frontend upload handling, prediction rendering, and user-facing feedback. This shows how deep learning can be integrated into a production-like application.

From an educational perspective, the project supports structured yoga learning. Users can follow weekly lessons rather than random videos. The XP and points system encourages regular participation. Bonus content gives learners a reason to complete the course. The course detail page clearly shows what the learner will receive before enrollment.

From a wellness perspective, the AI detector can help users identify the asana they are performing. Although the current version performs classification rather than full biomechanical correction, it is still useful for awareness, self-checking, and learning posture names. It creates a foundation for future real-time posture correction.

From a business perspective, the project supports paid courses through Razorpay. This means Yogashrini can function as a real wellness platform where instructors or administrators publish premium learning material and users enroll securely.

From an administrative perspective, the system reduces manual work. Admins can add courses, upload videos, manage retreats, and maintain products through a separate admin interface. This makes the platform easier to operate over time.

From a research perspective, the project provides a practical implementation of transfer learning for multi-class yoga pose classification. The use of EfficientNetB0 shows how a compact modern CNN can be adapted for a domain-specific dataset.

Overall, Yogashrini is significant because it transforms yoga learning from passive content consumption into an interactive, trackable, AI-supported digital experience.

<div style="page-break-after: always;"></div>

## 15. Technical Approach

### 15.1 Overall Architecture

Yogashrini uses a multi-layer architecture:

1. React frontend for user interface.
2. Node.js/Express backend for application APIs.
3. MongoDB database through Mongoose models.
4. Flask/TensorFlow backend for AI inference.
5. Saved EfficientNetB0 weights and class names for prediction.
6. External services such as Razorpay and OpenRouter.

The frontend communicates with the Express backend at `http://localhost:2000` for courses, payments, users, and chatbot features. It communicates with the Flask backend at `http://localhost:5000` for posture prediction.

### 15.2 Frontend Design

The frontend is built with React 19, React Router, Bootstrap, React Icons, Chart.js support, Formik, and Yup. The route structure includes:

- `/` for UserDashboard.
- `/login` for Login.
- `/about` for About.
- `/classes` for Classes.
- `/retreat` for Retreat.
- `/training` for Training.
- `/contact` for Contact.
- `/posture` for AI posture detection.
- `/types` for yoga pose types.
- `/courses` for course listing.
- `/course/:id` for course detail.
- `/course/:id/week/:weekNum` for weekly playback.

The Posture page is especially important. It uses drag-and-drop upload, file browsing, image validation, canvas based resizing, fetch-based API communication, loading states, result states, confidence coloring, annotated image display, and top-5 prediction visualization.

### 15.3 Express Backend

The Express backend uses:

- `express` for APIs.
- `mongoose` for database connection.
- `cors` for allowed frontend origins.
- `express-fileupload` for thumbnails and video uploads.
- `bcrypt` for password hashing.
- `jsonwebtoken` for user authentication.
- `razorpay` for payment integration.
- `dotenv` for environment variables.

The backend organizes routes into modules:

- `/admin`
- `/user`
- `/course`
- `/payment`
- `/product`
- `/retreat`
- `/chat`

Course routes manage course listing, course creation, course update, course deletion, week listing, week addition, week update, and week deletion. Payment routes manage order creation, verification, enrollment check, user enrollments, week completion, and enrollment statistics.

### 15.4 Database Schemas

The Course schema stores title, description, price, thumbnail filename, total weeks, level, publication status, and instructor. The Week schema stores course ID, week number, title, description, videos, bonus XP, bonus points, and whether the week is bonus content. The Enrollment schema stores user ID, course ID, payment status, order ID, payment ID, completed weeks, total XP, total points, bonus unlock status, and purchase date. The User schema stores user identity, hashed password, email, role, and timestamps.

This schema design supports the learning flow from course browsing to payment to weekly progress tracking.

### 15.5 AI Backend

The AI backend is written in Flask. It loads class names from `saved_models/class_names.json` and weights from `saved_models/efficientnetb0_yoga.weights.h5`. The model is rebuilt at server startup using the same architecture used during training.

The `/health` endpoint reports the model status, model name, class count, and reported accuracy. The `/classes` endpoint returns all class names. The `/predict` endpoint accepts an image data URL and returns the prediction result.

The prediction pipeline is:

1. Receive JSON request with `image`.
2. Decode base64 data URL.
3. Open image with PIL and convert to RGB.
4. Resize to 224 x 224.
5. Convert to NumPy float32 array.
6. Add batch dimension.
7. Run EfficientNetB0 prediction.
8. Sort probabilities to get top-5 predictions.
9. Draw annotated output image.
10. Return label, score, confidence percentage, top-5 list, and annotated image.

### 15.6 Model Architecture

The model architecture is:

```text
Input image: 224 x 224 x 3
EfficientNetB0 base with ImageNet weights
GlobalAveragePooling2D
Dense(512, activation="relu")
BatchNormalization
Dropout(0.5)
Dense(47, activation="softmax")
```

During fine-tuning, the lower EfficientNet layers are frozen up to a defined layer index while upper layers are trainable. This approach preserves general visual knowledge from ImageNet and adapts high-level features to yoga postures.

### 15.7 Course and Payment Workflow

The user opens the course listing page, selects a course, and reaches the course detail page. If the course is free, the backend creates a paid enrollment record directly with `isPaid: true`. If the course is paid, the backend creates a Razorpay order. The frontend opens Razorpay checkout. After payment, Razorpay returns payment details to the frontend, and the backend verifies the HMAC signature. Only after verification is the enrollment confirmed.

### 15.8 Weekly Progress Workflow

After enrollment, the user can open a week. The WeekPlayer fetches course details and week details. If the user is not enrolled, the system redirects them back to the course detail page. When the user marks the week complete, the backend checks enrollment, checks the week, updates completed weeks, adds XP and points, checks bonus unlock conditions, and saves the enrollment.

### 15.9 Chatbot Workflow

The chatbot frontend collects user input and sends it to `/chat` on the Express server. The backend checks the OpenRouter API key and forwards the message to `https://openrouter.ai/api/v1/chat/completions`. The response is returned to the frontend and displayed in the chat window.

### 15.10 Testing and Evaluation Scripts

The project contains testing and evaluation scripts:

- `eval_model.py` rebuilds the EfficientNetB0 model, loads weights, creates a validation generator, evaluates validation loss and accuracy, calculates top-k accuracy, and prints a classification report.
- `classify_tests.py` classifies images from a test folder, prints a console table, saves a visual prediction grid, and shows top-5 predictions.
- `test_api.py` sends a real image to the Flask backend and prints predicted pose, confidence, annotated image status, and top-5 results.
- `scan_dataset.py` scans dataset classes, image counts, average size, resolution, and color modes.

<div style="page-break-after: always;"></div>

## 16. Dataset Overview

The dataset is organized in a folder-per-class structure under the `Dataset` directory. Each folder represents one yoga asana. The project contains 47 classes and 2,756 image files. This structure is suitable for Keras/TensorFlow image classification workflows because class labels can be derived from folder names.

### 16.1 Dataset Summary

| Property | Value |
|---|---:|
| Number of classes | 47 |
| Total images | 2,756 |
| Input size used by model | 224 x 224 |
| Image types counted | JPG, JPEG, PNG, WEBP |
| Model output | 47-class softmax |
| Validation split used in evaluation script | 20 percent |

### 16.2 Class Distribution

| Class | Images |
|---|---:|
| Adho Mukha Svanasana | 74 |
| Adho Mukha Vrksasana | 65 |
| Alanasana | 18 |
| Anjaneyasana | 71 |
| Ardha Chandrasana | 59 |
| Ardha Matsyendrasana | 96 |
| Ardha Navasana | 13 |
| Ardha Pincha Mayurasana | 54 |
| Ashta Chandrasana | 12 |
| Baddha Konasana | 81 |
| Bakasana | 84 |
| Balasana | 79 |
| Bitilasana | 94 |
| Camatkarasana | 62 |
| Dhanurasana | 54 |
| Eka Pada Rajakapotasana | 53 |
| Garudasana | 85 |
| Halasana | 71 |
| Hanumanasana | 41 |
| Malasana | 73 |
| Marjaryasana | 56 |
| Navasana | 18 |
| Padmasana | 77 |
| Parsva Virabhadrasana | 14 |
| Parsvottanasana | 43 |
| Paschimottanasana | 62 |
| Phalakasana | 66 |
| Pincha Mayurasana | 43 |
| Salamba Bhujangasana | 62 |
| Salamba Sarvangasana | 73 |
| Setu Bandha Sarvangasana | 66 |
| Sivasana | 20 |
| Supta Kapotasana | 13 |
| Trikonasana | 23 |
| Upavistha Konasana | 17 |
| Urdhva Dhanurasana | 74 |
| Urdhva Mukha Svsnssana | 69 |
| Ustrasana | 96 |
| Utkatasana | 81 |
| Uttanasana | 71 |
| Utthita Hasta Padangusthasana | 64 |
| Utthita Parsvakonasana | 69 |
| Vasisthasana | 80 |
| Virabhadrasana One | 63 |
| Virabhadrasana Three | 69 |
| Virabhadrasana Two | 60 |
| Vrksasana | 68 |

### 16.3 Dataset Observations

The dataset is moderately imbalanced. Some classes contain many examples, such as Ardha Matsyendrasana and Ustrasana with 96 images each, while classes such as Ashta Chandrasana, Ardha Navasana, Supta Kapotasana, and Parsva Virabhadrasana contain fewer examples. This imbalance can affect the model because classes with more examples may be learned more strongly than underrepresented classes. Data augmentation and transfer learning help reduce this problem, but future versions should add more samples for low-count classes.

The dataset contains a mixture of posture types. Some poses are visually distinct, such as Padmasana, Balasana, and Sivasana. Other poses are more similar, such as Virabhadrasana One, Virabhadrasana Two, Virabhadrasana Three, and Parsva Virabhadrasana. The presence of similar classes makes the classification problem more challenging and more realistic.

### 16.4 Preprocessing

Before prediction, each image is resized to 224 x 224 pixels. Images are converted to RGB and represented as float32 arrays. EfficientNet handles the required normalization internally in the Keras application pipeline. During training, transfer learning and augmentation improve generalization across variations in background, camera distance, pose scale, and lighting.

<div style="page-break-after: always;"></div>

## 17. Result and Discussion

The results of Yogashrini can be discussed in two major parts: AI model performance and platform functionality.

### 17.1 AI Model Results

The implemented AI backend reports the model as EfficientNetB0 with 47 classes and approximately 84.96 percent accuracy. The model uses saved weights stored in `saved_models/efficientnetb0_yoga.weights.h5`. Evaluation artifacts in the project include:

- `training_history.png`
- `confusion_matrix_norm.png`
- `per_class_accuracy.png`
- `prediction_grid.png`
- `confidence_distribution.png`
- `some_tests_results.png`
- `some_tests_confidence.png`
- dataset distribution and resolution charts

The model produces top-5 predictions, which is important because yoga pose recognition can contain ambiguity. For example, warrior pose variations may appear similar, and camera angle may reduce visible differences between related postures. A top-5 output helps users see whether the correct answer was near the top even when the top-1 prediction is uncertain.

Confidence color coding improves interpretability. The frontend treats confidence above 70 percent as high, between 45 and 70 percent as medium, and below 45 percent as low. This makes the output more user-friendly because users can quickly understand whether the prediction should be trusted.

### 17.2 Strengths of the AI Module

The model has several strengths:

- It supports 47 classes, which is broad for a yoga classification project.
- It uses EfficientNetB0, which is efficient and suitable for web inference.
- It returns top-5 predictions instead of only one label.
- It returns an annotated image, improving visual feedback.
- It is served through a clean Flask API.
- It can be tested independently through `test_api.py`.
- It separates AI inference from business logic, making the system easier to maintain.

### 17.3 Limitations of the AI Module

The current system performs image classification, not full posture correction. It can identify the pose category but does not yet calculate joint angles or tell the user exactly which body part needs adjustment. It also depends on image quality. Poor lighting, cropped bodies, motion blur, unusual camera angles, or cluttered backgrounds can reduce confidence. The dataset imbalance may also cause weaker performance for classes with fewer samples.

### 17.4 Platform Results

The platform implementation successfully connects major user workflows:

- User can register and log in.
- User can browse course list.
- User can view course detail and curriculum.
- User can enroll in free or paid courses.
- User can complete weeks and earn XP.
- User can unlock bonus content.
- User can use the posture detector.
- User can chat with the assistant.
- Admin can manage courses, retreats, products, weeks, videos, and thumbnails.

The project therefore demonstrates not only model performance but complete system integration.

### 17.5 Discussion

Yogashrini shows that an AI model becomes more useful when placed inside a full product workflow. A standalone classifier is interesting, but a classifier inside a learning platform becomes practical. Users can learn from videos, practice poses, upload their own posture image, receive a model prediction, and continue structured lessons. This creates a cycle of learning, practicing, checking, and improving.

The separation between the Express backend and Flask backend is a good engineering decision. It allows JavaScript to handle web platform features while Python handles machine learning. This avoids forcing TensorFlow into the Node backend and keeps each service focused.

The result is a working AI-enabled wellness platform with clear scope for improvement. The current version is suitable for image-based pose recognition and digital course delivery. Future versions can improve from classification to correction.

<div style="page-break-after: always;"></div>

## 18. Future Work

Although Yogashrini already includes many features, several improvements can make it more powerful, accurate, and user-friendly.

### 18.1 Real-Time Webcam Pose Detection

The current AI system works through uploaded images. A major future improvement is real-time webcam-based posture detection. Users could practice in front of a camera and receive instant feedback while moving. This would make the system more interactive and closer to live instructor guidance.

### 18.2 Keypoint and Joint-Angle Correction

Future versions should integrate pose estimation models such as MediaPipe, MoveNet, or OpenPose. These tools can extract body keypoints such as shoulders, elbows, wrists, hips, knees, and ankles. The system could then calculate joint angles and provide specific correction messages, such as "raise your left arm", "straighten your back", or "bend the front knee more".

### 18.3 Hybrid Model

A hybrid system could combine EfficientNetB0 classification with skeleton-based correction. EfficientNetB0 can identify the pose category, and keypoint analysis can verify alignment. This would make the system more accurate and more useful for real yoga practice.

### 18.4 Larger and More Balanced Dataset

The current dataset contains 2,756 images across 47 classes, but some classes have very few samples. Future work should collect more images for underrepresented classes. Images should include diverse body types, backgrounds, clothing styles, camera angles, lighting conditions, and indoor/outdoor environments.

### 18.5 Mobile Application

A mobile version would make the system more convenient because yoga learners often use phones while practicing. A React Native or Flutter app could connect to the existing backend APIs and AI inference service.

### 18.6 Personalized Recommendations

The platform could recommend courses based on user progress, completed weeks, preferred level, pose detection results, and goals. For example, a user struggling with balance poses could receive a beginner balance sequence.

### 18.7 Instructor Feedback Module

The system could allow users to upload posture images or videos for instructor review. Instructors could provide comments, corrections, and personalized advice.

### 18.8 Certificate Generation

After completing a course, the system could generate a downloadable certificate. This would increase motivation and make the learning experience feel more complete.

### 18.9 Advanced Analytics Dashboard

The admin dashboard could include revenue charts, course popularity, completion rates, user retention, posture detection usage, and class-wise model confidence analytics.

### 18.10 Secure Production Deployment

Future deployment should move secrets fully into environment variables, use HTTPS, configure production CORS, add rate limiting, improve logging, store media in cloud storage, and deploy backend services using containers.

<div style="page-break-after: always;"></div>

## 19. Conclusion

Yogashrini successfully demonstrates how yoga education can be enhanced through a combination of full-stack web development and artificial intelligence. The project provides a user-facing yoga platform, an admin management system, a course enrollment workflow, a weekly learning player, gamified progress tracking, chatbot support, payment integration, and an EfficientNetB0 based AI posture detector.

The AI component recognizes 47 yoga asanas from uploaded images and returns confidence-based top-5 predictions with annotated output. The model is supported by a dataset of 2,756 images and deployed through a Flask API. The web platform is built using React, Node.js, Express.js, MongoDB, and Mongoose, while Razorpay and OpenRouter extend the system with payment and chatbot capabilities.

The project is important because it moves beyond static yoga content. It creates a more interactive learning experience where users can learn, practice, check posture, track progress, and receive support. While the current version performs classification rather than full posture correction, it forms a strong foundation for real-time, keypoint-based, personalized yoga guidance in the future.

In conclusion, Yogashrini is a practical and meaningful AI-enabled wellness platform. It shows that traditional yoga practices can be supported by modern web engineering and deep learning, making yoga learning more accessible, structured, intelligent, and engaging.

<div style="page-break-after: always;"></div>

## 20. References

1. M. Tan and Q. V. Le, "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks," ICML 2019. Google Research: https://research.google/pubs/efficientnet-rethinking-model-scaling-for-convolutional-neural-networks/

2. TensorFlow, "tf.keras.applications.EfficientNetB0," TensorFlow API Documentation: https://www.tensorflow.org/api_docs/python/tf/keras/applications/EfficientNetB0

3. Express.js, "Express routing," Official Express Documentation: https://expressjs.com/en/guide/routing.html

4. Mongoose, "Schemas," Official Mongoose Documentation: https://mongoosejs.com/docs/guide.html

5. Razorpay, "Orders APIs," Razorpay API Documentation: https://razorpay.com/docs/api/orders/

6. OpenRouter, "Create a chat completion," OpenRouter API Documentation: https://openrouter.ai/docs/api-reference/chat-completion

7. Project source file: `Python Backend/app.py`, Yogashrini Flask AI backend.

8. Project source file: `Frontend/src/pages/Posture.js`, Yogashrini AI posture detector frontend.

9. Project source file: `Server/index.js`, Yogashrini Express backend entry point.

10. Project source file: `Server/controller/course_controller.js`, Yogashrini course and week management logic.

11. Project source file: `Server/controller/payment_controller.js`, Yogashrini Razorpay and enrollment logic.

12. Project source file: `saved_models/class_names.json`, Yogashrini 47-class yoga posture label file.

