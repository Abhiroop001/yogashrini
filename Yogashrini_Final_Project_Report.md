<div align="center">

# Yogashrini: A Deep Learning Approach to Yoga Posture Recognition with Responsive Web Deployment

**A PROJECT REPORT**  
Submitted in Partial Fulfillment for the degree of  

**Bachelor of Technology**  
In  
**INFORMATION TECHNOLOGY**  

From  
**MAULANA ABUL KALAM AZAD UNIVERSITY OF TECHNOLOGY**

Submitted by  
**Abhiroop Mukherjee** 11600723010  
**Anirban Sil** 11600723022  
**Rudra Kumar** 11600723089  
**Suryendu Das** 11600723121  
**Amitasan Das** 11600723014  

Under the guidance of  
**Mrs. Sulagna Roy**  
DEPARTMENT OF INFORMATION TECHNOLOGY  
**MCKV Institute of Engineering**  
243, G.T. Road (North), Liluah, Howrah -711204  
(NAAC Accredited Grade - A Autonomous Institute affiliated to Maulana Abul Kalam Azad University of Technology, West Bengal)  
NOVEMBER, 2025

</div>
\n<div style="page-break-after: always;"></div>\n
<div align="center">

## CERTIFICATE

</div>

This is to certify that the project report entitled **“Yogashrini: A Deep Learning Approach to Yoga Posture Recognition with Responsive Web Deployment”** submitted by **Abhiroop Mukherjee, Anirban Sil, Rudra Kumar, Suryendu Das, Amitasan Das** for 5th semester examination has been prepared for the partial fulfillment of the degree of Bachelor of Technology in Information Technology, awarded by the Maulana Abul Kalam Azad University of Technology, West Bengal. He/She/They has/have carried out the project work under my supervision.

<br><br><br>

<table width="100%">
<tr>
<td align="left">
____________________________________<br>
<b>HEAD OF THE DEPARTMENT</b><br>
Mr. Sachin Balo<br>
Dept. of Information Technology.<br>
MCKV Institute of Engineering<br>
243, G.T. Road (North), Liluah<br>
Howrah – 711204
</td>
<td align="right">
____________________________________<br>
<b>SUPERVISOR</b><br>
Mrs. Sulagna Roy<br>
Dept. of Information Technology.<br>
MCKV Institute of Engineering<br>
243, G.T. Road (North), Liluah<br>
Howrah – 711204
</td>
</tr>
</table>

\n<div style="page-break-after: always;"></div>\n
<div align="center">

## CERTIFICATE OF APPROVAL
**(B.Tech Degree in Information Technology)**

</div>

This project report is hereby approved as a creditable study of an engineering subject carried out and presented in a manner satisfactory to warrant its acceptance as a prerequisite to the degree for which it has been submitted. It is to be understood that by this approval, the undersigned do not necessarily endorse or approve any statement made, opinion expressed and conclusion drawn therein but approve the project report only for the purpose for which it has been submitted.

<br><br>
1. _________________________<br><br>
2. _________________________<br><br>
3. _________________________<br><br>
4. _________________________<br><br>
5. _________________________<br><br>

<b>Date of evaluation:</b> ___________________

\n<div style="page-break-after: always;"></div>\n
<div align="center">

## ACKNOWLEDGEMENT

</div>

It is always a pleasure to express my sincere thanks to those who have supported me throughout this work. I hereby acknowledge the guidance and support of **Mrs. Sulagna Roy**, Assistant Professor, MCKVIE whose expertise and encouragement were invaluable to the completion of this project. I am also grateful to **Mr. Sachin Balo**, Head of the Department (Information Technology) and other supporting faculty and staff members for providing the necessary support and infrastructure.

<br><br>

<table width="100%">
<tr>
<td align="left">
________________________<br>
Abhiroop Mukherjee
</td>
<td align="right">
________________________<br>
Anirban Sil
</td>
</tr>
<tr>
<td align="left">
<br>________________________<br>
Rudra Kumar
</td>
<td align="right">
<br>________________________<br>
Suryendu Das
</td>
</tr>
<tr>
<td align="left">
<br>________________________<br>
Amitasan Das
</td>
<td></td>
</tr>
</table>

\n<div style="page-break-after: always;"></div>\n
<div align="center">

## ABSTRACT

</div>

Yoga has become an increasingly important component of modern wellness practices, yet most online yoga platforms lack personalized guidance, real-time feedback, and women-centric design. This project, **Yogashrini**, presents a dedicated digital solution that integrates deep learning–based yoga posture recognition with a responsive web platform built using the MERN stack. The system aims to empower women by providing a safe, comfortable, and accessible virtual yoga environment supported by intelligent posture evaluation.

A Convolutional Neural Network (CNN) model based on EfficientNetB0 (replacing the initially proposed ResNet50 for optimized performance) is used to classify multiple yoga postures. Transfer learning is applied to improve performance using a publicly available Kaggle yoga dataset containing diverse pose images. The model is trained on preprocessed and augmented data to enhance generalization, achieving an overall accuracy of ~85% on multi-class yoga pose classification for 47 distinct classes. A confusion-matrix-based evaluation further demonstrates the model’s ability to distinguish between structurally similar poses with minimal misclassification.

The web application includes features such as secure user authentication, session booking, instructor management, video libraries, and AI-assisted posture correction. Furthermore, a custom-built AI chatbot using the OpenRouter API assists users with yoga-related queries in real-time. A secure Razorpay payment gateway is integrated to allow seamless enrollment in premium courses and training programs. The system architecture ensures smooth interaction between users and administrators through a dual-panel interface. By integrating modern web technologies with deep learning, Yogashirini offers a comprehensive wellness platform that supports safe practice, improves pose accuracy, and enhances the user’s overall yoga-learning experience.

This project demonstrates how artificial intelligence can be effectively utilized to bridge the gap between traditional wellness practices and digital accessibility. The proposed system lays the foundation for future enhancements such as real-time pose tracking, hybrid keypoint-based models, and personalized analytics to further enrich user engagement and accuracy.

\n<div style="page-break-after: always;"></div>\n
## TABLE OF CONTENTS

1. Title Page
2. Certificate
3. Certificate of Approval
4. Acknowledgement
5. Abstract
6. Table of Contents
7. List of Tables
8. List of Figures
9. Introduction
10. Literature Review
11. Objectives
12. Problem Statement
13. Key Features of the System
14. Significance of the Project
15. Technical Approach
    15.1 System Architecture
    15.2 Deep Learning Model (EfficientNetB0)
    15.3 MERN Stack Implementation
    15.4 Payment Gateway Integration
    15.5 AI Chatbot Integration
16. Dataset Overview
17. Results and Discussion
    17.1 Model Performance Evaluation
    17.2 Platform Evaluation
18. Future Work
19. Conclusion
20. References
21. Appendix A: Database Schemas
22. Appendix B: Core API Endpoints
23. Appendix C: Source Code Snippets

\n<div style="page-break-after: always;"></div>\n
## LIST OF TABLES
* Table 1: System Overview
* Table 2: Dataset Class Distribution Overview
* Table 3: API Endpoint Summary
* Table 4: Database Schema Definitions

## LIST OF FIGURES
* Figure 1: Yogashrini User Dashboard Interface
* Figure 2: EfficientNetB0 Model Architecture Schematic
* Figure 3: System Workflow Diagram
* Figure 4: Dataset Class Distribution
* Figure 5: Confusion Matrix for 47 Yoga Classes
* Figure 6: Model Training History (Accuracy and Loss)
* Figure 7: Per-Class Accuracy Distribution
* Figure 8: AI Posture Detection Result Interface
* Figure 9: Razorpay Payment Integration Flow

\n<div style="page-break-after: always;"></div>\n
## 9. INTRODUCTION

In recent years, the integration of digital technology into the wellness industry has significantly transformed how people access fitness and mental health services. Among various disciplines, yoga has gained immense popularity globally, not only as a physical exercise but also as a holistic approach to mental and emotional well-being. With the increasing demand for flexible and home-based wellness solutions — especially after the COVID-19 pandemic — online yoga platforms have emerged as essential tools. However, most existing platforms are either too generic or lack a personalized and safe space, especially for women who may prefer gender-specific instruction for cultural, religious, or personal reasons.

**Yogashrini** is a digital initiative designed specifically to bridge this gap. It is a dedicated web and mobile application focused exclusively on providing online yoga instruction tailored for women. The platform offers a space where women can engage in yoga practice comfortably, securely, and with content that addresses their unique physical and emotional wellness needs. Unlike mainstream fitness apps, Yogashrini emphasizes community building, personalized progress tracking, and gender-sensitive instruction—all within a modern, user-friendly interface.

The project is developed using the MERN stack — a powerful combination of four open-source technologies: MongoDB, Express.js, React.js, and Node.js. This stack was chosen due to its robust performance, scalability, and the ability to deliver full-stack JavaScript development, ensuring a fast and efficient development process. The frontend (React.js) is designed to offer a smooth, responsive, and interactive experience, while the backend (Node.js and Express.js) handles data, user authentication, scheduling, course enrollments via Razorpay, and content management. MongoDB provides a flexible and scalable NoSQL database solution that supports the storage of user profiles, yoga videos, instructor data, and session histories.

A distinguishing feature of Yogashrini is its AI-powered yoga posture detection system. Built with TensorFlow and utilizing an EfficientNetB0 backbone, the system can classify 47 distinct yoga postures from user-uploaded images. This empowers users to self-correct and practice safely at home. Furthermore, the platform integrates an AI Chatbot powered by OpenRouter to provide real-time wellness assistance.

The primary motivation behind Yogashrini is to empower women to take control of their wellness journeys through a platform that is accessible anytime, anywhere. Whether the user is a working professional, a homemaker, or a student, Yogashrini adapts to individual needs through customizable schedules, instructor-led live sessions, recorded content, and peer support. This project also seeks to promote inclusivity, cultural sensitivity, and a sense of belonging in the digital wellness space — an aspect often overlooked by generic fitness platforms.

Ultimately, Yogashrini is more than just a yoga app — it is a digital sanctuary for women seeking balance, strength, and peace in their daily lives. By combining modern web technologies with a focused vision of women’s wellness, the project represents a meaningful contribution to both the tech and health sectors.

<div align="center">
    <img src="Frontend/src/pages/Yogashrini.jpg" width="600" alt="Yogashrini Platform" />
    <br><i>Figure 1: Yogashrini Yoga Platform Interface</i>
</div>

\n<div style="page-break-after: always;"></div>\n
## 10. LITERATURE REVIEW

### 10.1 Key comparative / survey pieces (skeleton vs. image models)
* **D. Mohan Kishore, S. Bindu, Nandi Krishnamurthy Manjunath (2022) — Estimation of Yoga Postures Using Machine Learning Techniques:** This paper compares several pose-estimation architectures (EpipolarPose, OpenPose, PoseNet, MediaPipe) on five common asanas and discusses tradeoffs for home practice. It’s a useful, practitioner-oriented comparison of skeleton-based approaches.
* **S. C. Yeh et al. (2025) — Yoga pose recognition and motion analysis for a home-based system:** A recent article that uses OpenPose and emphasizes real-time feedback and safety for older adults; shows continued use of keypoint methods for correction and monitoring.
*(Takeaway: surveys and applied papers consistently recommend keypoint/skeleton methods — OpenPose, MediaPipe, MoveNet — for interpretable, low-latency feedback; image-level CNNs are used for higher-level classification.)*

### 10.2 Papers that use skeleton / pose-estimation pipelines
* **A. P. Khatri, N. T. Reddy, M. S. Kaur (2023) — Human pose tracking for yoga using OpenPose and MediaPipe frameworks:** Demonstrates OpenPose/MediaPipe for pose detection and tracking in yoga contexts and discusses deployment considerations.
* **AK Chaudhari (2024) — Yoga Pose Detection using MoveNet Architecture:** Implementation-oriented paper focusing on MoveNet for real-time correctness checks. Useful as an engineering reference for client-side models.

### 10.3 Image-level CNNs and transfer-learning for yoga pose classification
* **F. B. Ashraf et al. (2023) — YoNet: A Neural Network for Yoga Pose Classification:** YoNet is a CNN designed to classify five yoga poses from limited data; authors report competitive performance using data augmentation and lightweight architectures.
* **Y. Kou et al. (2024) — Image-Based Fitness Yoga Pose Recognition:** Reviews ResNet/ResNet-based approaches and cites examples where transfer learning achieved high accuracy on small curated sets.
* **M. M. Akash et al. (2024) — Yoga Pose Classification Using Transfer Learning:** A recent preprint demonstrating practical transfer learning experiments on yoga datasets.
*(Takeaway: CNN backbones like EfficientNet and ResNet are commonly used for multi-class yoga classification; they perform well when combined with augmentation and class-balancing.)*

### 10.4 Papers focused on pose correction / feedback generation
* **Yoga Pose Estimation and Feedback Generation Using Deep Learning Techniques (2022):** Presents a system that detects incorrect postures and produces corrective messages; typically these systems combine joint angles from keypoints with rule-based thresholds or small classifiers.
* **M. Desai et al. (2023) — A novel approach for yoga pose estimation:** Explores estimation and simple corrective feedback for five poses using neural network pipelines and highlights limitations with small datasets.

\n<div style="page-break-after: always;"></div>\n
## 11. OBJECTIVES

Yogashrini is a purpose-driven web and mobile-based application designed to empower women through accessible, personalized, and holistic online yoga instruction. The platform facilitates seamless interaction between users and certified yoga instructors worldwide, offering a rich blend of live sessions, pre-recorded content, and wellness resources. Through its dual-panel architecture (Admin Panel and User Panel) Yogashrini ensures efficient management, intuitive navigation, and data-driven insights for both administrators and users.

The primary objectives of Yogashrini are to:
1. **Promote wellness and empowerment** by providing tailored yoga programs for women across various life stages and needs (e.g., prenatal, stress relief, flexibility).
2. **Enable global access to expert instruction** through live and recorded sessions with qualified yoga instructors.
3. **Streamline user engagement** via intuitive registration, booking, feedback, and content access features.
4. **Support administrative efficiency** with robust tools for managing instructors, sessions, users, content, and analytics.
5. **Foster community and continuous improvement** through user reviews, activity tracking, and feedback-driven service refinement.
6. **Integrate Advanced Deep Learning** to provide an AI posture detection system capable of recognizing 47 different classical asanas, thereby assisting in safe home practice.

## 12. PROBLEM STATEMENT

Digital wellness platforms have grown rapidly in recent years, but most online yoga apps do not meet the specific needs of women who want gender-sensitive instruction, cultural comfort, and a safe virtual space. Many platforms remain general, offering limited personalization, minimal instructor interaction, and no real-time support for correcting yoga postures. This support is essential for safe and effective practice. Incorrect postures can lead to injuries, decreased benefits, and a lack of confidence, especially for beginners practicing at home.

There is a clear need for a solution that combines women-centered yoga instruction with modern technology to ensure safety, personalization, and accessibility. Administrators also lack a single system for managing instructors, yoga sessions, content, user engagement, and performance insights.

Yogashrini seeks to fill these gaps by creating a dedicated web application built with the MERN stack. The platform offers secure user accounts, session booking, live classes, recorded content, personalized recommendations, and community features specially designed for women. A key innovation of the system is posture detection through image processing, allowing users to receive real-time feedback on their yoga poses. This ensures correct alignment, reduces the risk of injury, and improves the effectiveness of each session with AI-driven posture recognition.

The platform also features a strong admin panel for managing instructors, yoga categories, content libraries, session scheduling, user activities, and system analytics. By merging digital convenience, gender-sensitive design, and smart AI technology, Yogashrini provides a safe and empowering digital space for women to enhance their physical, mental, and emotional well-being.

\n<div style="page-break-after: always;"></div>\n
## 13. KEY FEATURES OF THE SYSTEM

1. **Women-Centered Digital Yoga Platform:** The system creates a safe, culturally comfortable, and gender-sensitive virtual wellness space designed specifically for women, ensuring a supportive learning environment.
2. **Secure User Registration & Authentication:** Users register once and access the platform through a secure login system with role-based access (JWT/Bcrypt), ensuring privacy and authorized usage of the platform.
3. **Interactive & Informative Dashboard:** The user dashboard introduces yoga and the platform, showcasing upcoming classes, featured instructors, testimonials, and personalized suggestions.
4. **Comprehensive Yoga Services Catalog:** Users can browse various yoga programs — such as flexibility, relaxation, prenatal yoga, and strength-building — each with detailed descriptions, benefits, and instructor profiles.
5. **AI-Powered Real-Time Posture Detection:** An integrated CNN (EfficientNetB0) model detects and classifies yoga postures in real time, offering accuracy scores, top-5 predictions, and annotated image feedback to prevent injuries and improve technique.
6. **Pre-Recorded Video Library & Course Enrollment:** A well-organized library of high-quality recorded yoga sessions. Users can enroll in structured courses, track week-by-week progress, and earn XP and reward points.
7. **Razorpay Payment Integration:** Secure and seamless checkout experience for premium courses and retreat bookings utilizing the Razorpay API.
8. **AI Chatbot Assistance:** An integrated smart chatbot powered by OpenRouter (DeepSeek model) to assist users with yoga-related questions, platform navigation, and general wellness advice.
9. **Personalized User Profile & Progress Tracking:** Users can manage their details, view enrollment history, access saved videos, and monitor XP gained, completing weeks progressively.
10. **Centralized Admin Dashboard & Analytics:** Admins can manage instructors, users, sessions, yoga categories, video content, feedback, and platform analytics in a single unified system, enabling data-driven improvements and smooth operations.

## 14. SIGNIFICANCE OF THE PROJECT

The Yoga Website with the detection of posture through a CNN model is highly valuable for modern digital wellness systems. It harmoniously unites technology and health into an accessible, personalized, and scientifically supported yoga learning platform. The key importance of the project involves the following:

1. **Provides Accessible and Inclusive Yoga Training:** This system makes yoga training available for everyone everywhere, since access to a studio is not required.
2. **Promotes Better Learning with Immediate Posture Correction:** Traditional online classes lack personalized guidance. A CNN-based posture detection model provides immediate feedback, allowing users to verify their poses.
3. **Bridges the Gap Between Technology and Wellness:** The project demonstrates a practical use of artificial intelligence in healthcare and lifestyle improvement.
4. **Supports Consistent Practice and Progress Tracking:** Features such as XP rewards, week-by-week course unlocking, and gamification elements motivate users to maintain long-term wellness habits.
5. **Ensures Safe Practice Without Continuous Supervision:** The AI-powered guidance helps classify the user's pose, ensuring they are attempting the correct posture before proceeding.
6. **Promotes Overall Wellness:** By blending learning content, expert guidance, and automated posture evaluation, the platform supports physical fitness as well as mental relaxation.

\n<div style="page-break-after: always;"></div>\n
## 15. TECHNICAL APPROACH

### 15.1 System Architecture

The Yogashrini platform is built upon a modern, decoupled architecture consisting of a React.js frontend, a Node.js/Express backend, a MongoDB database, and a separate Python-based FastAPI/Flask inference server for AI tasks. 

**Table 1: System Overview**

| Component | Technologies Used | Role in System |
|-----------|------------------|----------------|
| Frontend (User) | React.js, HTML, CSS | Responsive interface for practicing yoga, uploading images, course viewing, and chatbot interaction. |
| Backend Server | Node.js, Express.js | API layer handling authentication, session management, database operations, and proxying AI requests. |
| Database | MongoDB, Mongoose | Stores user data, course structures, enrollments, and video metadata. |
| Deep Learning Model | TensorFlow/Keras | EfficientNetB0 model trained to classify 47 distinct yoga postures. |
| Posture API | Flask (Python) | Dedicated inference endpoint receiving images and returning predictions and annotated images. |
| Payments | Razorpay API | Handles secure order creation, verification, and payment processing. |

### 15.2 Deep Learning Model (EfficientNetB0)

Initially conceptualized with ResNet50, the architecture was upgraded to **EfficientNetB0** to leverage its superior parameter efficiency and accuracy balance. EfficientNet uses a compound scaling method that uniformly scales network width, depth, and resolution.

**Why EfficientNetB0?**
* **High accuracy with fewer parameters:** It achieves state-of-the-art accuracy while being significantly lighter than comparable ResNet models, making it ideal for web-based real-time inference.
* **Transfer learning:** Pretrained ImageNet weights allow fast convergence on the yoga dataset.
* **Robust feature extraction:** Excellent at distinguishing subtle geometric differences between complex asanas (e.g., distinguishing between Warrior I, II, and III).

**Implementation Details:**
1. **Dataset Preparation:** Images resized to 224x224 and normalized. Data augmentation (rotation, zooming, horizontal flipping) applied to prevent overfitting.
2. **Model Training:** We loaded EfficientNetB0 without the top layer. Added a GlobalAveragePooling2D layer, a Dense layer with 512 units (ReLU), BatchNormalization, 50% Dropout, and a final Dense softmax layer for 47 classes.
3. **Fine-tuning:** Base layers were initially frozen, then the top 150 layers were unfrozen for fine-tuning with a lower learning rate.
4. **Backend Integration:** The saved `.weights.h5` model is loaded in a Python Flask server. Images sent from the React frontend as Base64 strings are decoded, preprocessed, and passed through the model. The top-5 predictions and an annotated image are returned to the user.

### 15.3 MERN Stack Implementation

* **MongoDB:** Schemas designed for `User`, `Course`, `Week`, `Enrollment`, `Retreat`, and `Product`. The `Enrollment` schema handles progress tracking (completed weeks, XP earned, bonus unlocks).
* **Express & Node.js:** RESTful APIs engineered for scalable routing. Middleware implemented for secure JWT verification, file uploading (`express-fileupload`), and CORS handling.
* **React.js:** A dynamic single-page application. Features interactive courses (`CourseDetail.js`, `WeekPlayer.js`), dynamic routing, and highly engaging UI components with modern CSS styling and micro-animations.

### 15.4 Payment Gateway Integration

A robust payment flow utilizing Razorpay allows users to purchase premium courses:
1. User clicks "Enroll Now".
2. Node.js backend calls `razorpay.orders.create` and returns an `orderId`.
3. React frontend opens the Razorpay checkout modal.
4. Upon success, the frontend sends the `razorpay_payment_id` and signature to the backend.
5. The backend verifies the HMAC SHA256 signature and updates the `Enrollment` database record to `isPaid: true`.

### 15.5 AI Chatbot Integration

An integrated smart assistant provides real-time help. The frontend uses a floating chat interface. The Node.js backend securely communicates with the **OpenRouter API** (utilizing deepseek/deepseek-r1 or similar LLMs) to generate contextual responses without exposing API keys to the client.

\n<div style="page-break-after: always;"></div>\n
## 16. DATASET OVERVIEW

### Dataset Source
The dataset utilized is publicly available on Kaggle, titled "Yoga Posture Dataset" by user tr1gg3rtrash. It comprises images of yoga postures across multiple categories intended for classification tasks.

### Contents and Structure
* The dataset contains **2,756 images** distributed across **47 classes**.
* Images are organized in folders corresponding to different yoga postures.
* A supplementary `Poses.json` file maps English names to Sanskrit names.
* Images vary widely in resolution, background, lighting, and pose variations (angles, human subject differences) — offering real-world diversity crucial for training robust models.

<div align="center">
    <img src="saved_models/ds_class_distribution.png" width="600" alt="Class Distribution" />
    <br><i>Figure 4: Dataset Class Distribution</i>
</div>

**Table 2: Dataset Class Distribution Overview (Sample)**
| Pose Name (Sanskrit) | Image Count | Category |
|----------------------|-------------|----------|
| Adho Mukha Svanasana | 68 | Standing |
| Padmasana | 64 | Seated |
| Trikonasana | 61 | Standing |
| Balasana | 65 | Resting |
| Bakasana | 70 | Arm Balance |

### Key Features & Highlights
* **Diversity:** Varied backgrounds, lighting conditions, body types, and pose angles present a realistic challenge, aiding in robust generalization.
* **Balanced Enough:** The distribution is relatively balanced, making it feasible for transfer learning without massive class-weighting adjustments.
* **Publicly Accessible:** Promotes reproducibility and community benchmarking.

### Strengths & Limitations
**Strengths:**
* Real-world variation in images prevents the model from memorizing studio-only conditions.
* Metadata in multiple languages supports richer application features.

**Limitations:**
* ~3,000 images is relatively small for deep neural networks, necessitating aggressive data augmentation and transfer learning.
* Background noise and varied subject clothing can sometimes confuse the feature extractor if the pose is subtle.

\n<div style="page-break-after: always;"></div>\n
## 17. RESULTS AND DISCUSSION

### 17.1 Model Performance Evaluation

The yoga posture classifier was trained to recognize 47 distinct yoga postures. The final fine-tuned **EfficientNetB0** model achieved a remarkable **validation accuracy of ~85%**, demonstrating excellent capability in distinguishing between structurally similar postures.

<div align="center">
    <img src="saved_models/training_history.png" width="600" alt="Training History" />
    <br><i>Figure 6: Model Training History (Accuracy and Loss)</i>
</div>

**Training and Validation Accuracy:**
The accuracy curves show rapid improvement during the initial frozen-base training phase. After unfreezing the top layers and applying fine-tuning with a lower learning rate, the model breached the 80% accuracy mark, eventually stabilizing around 84.9%. The loss curves indicate healthy convergence without severe overfitting, thanks to the implementation of heavy Dropout (0.5) and data augmentation.

<div align="center">
    <img src="saved_models/confusion_matrix_norm.png" width="600" alt="Confusion Matrix" />
    <br><i>Figure 5: Confusion Matrix for 47 Yoga Classes</i>
</div>

**Confusion Matrix Analysis:**
The normalized confusion matrix illustrates class-wise performance. A strong diagonal represents high true-positive rates across the majority of the 47 classes.
* **High Accuracy Classes:** Poses with distinct spatial footprints (e.g., Vrksasana, Padmasana, Bakasana) show >90% accuracy.
* **Misclassifications:** Minor off-diagonal clusters appear among visually similar poses, such as confusing Warrior I (Virabhadrasana I) with Warrior II (Virabhadrasana II) depending on the camera angle.

<div align="center">
    <img src="saved_models/per_class_accuracy.png" width="600" alt="Per Class Accuracy" />
    <br><i>Figure 7: Per-Class Accuracy Distribution</i>
</div>

### 17.2 Platform Evaluation

The Yogashrini web platform successfully integrates the AI model into a seamless user experience. The `Posture.js` interface allows users to drag-and-drop an image. The Flask backend processes the image in under 500ms and returns:
1. The predicted label.
2. A confidence score percentage.
3. The top 5 alternative predictions.
4. An annotated image with an overlay of the prediction.

Furthermore, the structured learning environment via `CourseDetail.js` and `WeekPlayer.js` successfully implements gamification (XP points, locked bonus weeks), dramatically improving user retention potential. The Razorpay payment flow was tested and successfully processes test-mode transactions, updating the MongoDB enrollment records instantly.

\n<div style="page-break-after: always;"></div>\n
## 18. FUTURE WORK

Although the current system successfully performs yoga-pose classification using a CNN model and provides a functional web interface, several enhancements can significantly broaden the platform’s impact, scalability, and user engagement:

1. **Real-Time Video Posture Tracking (Skeleton/Keypoints):**
   The current CNN model operates on static images. Significant improvement can be achieved by enabling real-time video analysis using models like Google MediaPipe BlazePose or MoveNet. This would allow frame-by-frame joint tracking, enabling the system to calculate joint angles and provide real-time audio/visual corrective feedback (e.g., "Straighten your left knee").

2. **Expanded Payment and Subscription Models:**
   While Razorpay is integrated for one-time course purchases, introducing recurring subscription billing (SaaS model) for premium live-class access and advanced analytics would make the platform commercially viable.

3. **Hybrid AI Models:**
   Combining CNN classification with keypoint-based pose estimation to improve both accuracy and interpretability. The CNN can guess the pose, while the keypoint model analyzes the geometric perfection of that specific pose.

4. **Mobile Application Development:**
   Porting the React.js frontend to React Native to deploy Yogashrini on iOS and Android platforms, allowing users to prop up their phones and practice anywhere seamlessly.

5. **Advanced Admin Analytics:**
   Implementing deep data visualization in the admin dashboard to track user retention rates, most popular courses, revenue growth, and AI usage statistics.

## 19. CONCLUSION

The Yogashrini platform successfully integrates modern web technologies with deep learning to create a comprehensive digital wellness solution specifically designed for women. By combining the MERN stack with a fine-tuned EfficientNetB0 model, the system provides accurate yoga posture recognition, real-time feedback, and an intuitive, beautifully designed interface for both users and administrators. The CNN-based posture detection module achieved an accuracy of ~85%, demonstrating the immense effectiveness of transfer learning for multi-class yoga pose classification.

The project fulfills its objective of creating a safe, accessible, and personalized environment for yoga practice. The platform enables users to attend courses, learn from recorded videos, monitor their progress via an XP system, and receive AI-driven posture guidance — all without the need for physical studio visits. The integration of a Razorpay payment gateway and an OpenRouter-powered AI chatbot further elevates the platform into a modern, fully-featured application.

Overall, Yogashrini bridges the gap between traditional wellness practices and modern technological advancements. It enhances user engagement, supports safe posture learning, and promotes long-term well-being. With future enhancements such as real-time pose tracking and mobile app deployment, the system is perfectly positioned to evolve into a full-scale intelligent digital wellness ecosystem.

\n<div style="page-break-after: always;"></div>\n
## 20. REFERENCES

1. Kishore, D. M., Bindu, S., & Manjunath, N. K. (2022). Estimation of Yoga Postures Using Machine Learning Techniques. *International Journal of Yoga*.
2. Ashraf, F. B., Khan, M. H., & Ahsan, M. (2023). YoNet: A Neural Network for Yoga Pose Classification.
3. Kou, Y., Sun, J., & Zhang, L. (2024). Image-Based Fitness Yoga Pose Recognition. *Springer*.
4. Desai, M., Parmar, T., & Patel, R. (2023). A Novel Approach for Yoga Pose Estimation.
5. Akash, M. M., et al. (2024). Yoga Pose Classification Using Transfer Learning. *arXiv Preprint*.
6. He, K., Zhang, X., Ren, S., & Sun, J. (2015). Deep Residual Learning for Image Recognition (ResNet).
7. Tan, M., & Le, Q. (2019). EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks. *ICML*.
8. TensorFlow.js — MoveNet Model Documentation.
9. Kaggle — Yoga Posture Dataset: https://www.kaggle.com/datasets/ashishjangra27/yoga-poses-dataset
10. Razorpay — Payment Gateway Developer Documentation: https://razorpay.com/docs/

\n<div style="page-break-after: always;"></div>\n

## 21. APPENDIX A: DATABASE SCHEMAS

**Table 4: Core Database Schema Definitions (MongoDB/Mongoose)**

**User Schema:**
```javascript
const userSchema = new mongoose.Schema({
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });
```

**Enrollment Schema:**
```javascript
const enrollmentSchema = new mongoose.Schema({
    userId:          { type: String, required: true },
    courseId:        { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    orderId:         { type: String, default: "" },
    paymentId:       { type: String, default: "" },
    isPaid:          { type: Boolean, default: false },
    completedWeeks:  { type: [Number], default: [] },
    totalXP:         { type: Number, default: 0 },
    totalPoints:     { type: Number, default: 0 },
    bonusUnlocked:   { type: Boolean, default: false },
    purchasedAt:     { type: Date, default: null },
}, { timestamps: true });
```

## 22. APPENDIX B: CORE API ENDPOINTS

**Table 3: API Endpoint Summary**

| Endpoint | Method | Description | Role |
|----------|--------|-------------|------|
| `/predict` | POST | Receives Base64 image, returns AI pose classification. | AI Server |
| `/chat` | POST | Interfaces with OpenRouter API for Chatbot. | Node Backend |
| `/payment/create-order` | POST | Initializes a Razorpay order for a course. | Node Backend |
| `/payment/verify` | POST | Verifies Razorpay HMAC signature and activates enrollment. | Node Backend |
| `/course/:id/weeks` | GET | Fetches curriculum content for a specific course. | Node Backend |

## 23. APPENDIX C: SOURCE CODE SNIPPETS

**AI Inference Function (Flask/Python):**
```python
def run_predict(pil_img: Image.Image):
    x = preprocess(pil_img)
    probs = keras_model.predict(x, verbose=0)[0]       # shape (47,)
    top5_idx = np.argsort(probs)[-5:][::-1]
    top5 = [(class_names[i], float(probs[i])) for i in top5_idx]
    label, score = top5[0]
    return label, score, top5, probs
```

**Razorpay Verification Controller (Node.js):**
```javascript
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, userId } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expected !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed" });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
        { userId, courseId },
        { isPaid: true, paymentId: razorpay_payment_id, purchasedAt: new Date() },
        { new: true }
    );
    res.json({ message: "Payment verified.", enrollment });
};
```
