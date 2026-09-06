# Add project specific ProGuard rules here

# ============================================
# React Native Core
# ============================================
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.** { *; }

-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# ============================================
# Hermes Engine
# ============================================
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# ============================================
# React Native Reanimated
# ============================================
-keep class com.swmansion.reanimated.** { *; }
-keep class androidx.core.** { *; }

# ============================================
# React Native Screens
# ============================================
-keep class com.swmansion.rnscreens.** { *; }
-keep class androidx.fragment.app.** { *; }

# ============================================
# React Native Gesture Handler
# ============================================
-keep class com.swmansion.gesturehandler.** { *; }

# ============================================
# React Native Safe Area Context
# ============================================
-keep class com.th3rdwave.safeareacontext.** { *; }

# ============================================
# React Native Vector Icons
# ============================================
-keep class com.oblador.vectoricons.** { *; }

# ============================================
# React Navigation
# ============================================
-keep class com.reactnavigation.** { *; }

# ============================================
# Keep Native Methods
# ============================================
-keepclassmembers class * {
    native <methods>;
}

# ============================================
# Keep Attributes for Stack Traces
# ============================================
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-renamesourcefileattribute SourceFile

# ============================================
# Keep Serializable Classes
# ============================================
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ============================================
# Optimization Settings
# ============================================
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 3
-allowaccessmodification
-dontpreverify

# ============================================
# Remove Debug Logs in Release
# ============================================
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}

# ============================================
# Suppress Warnings
# ============================================
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ============================================
# Keep JSC
# ============================================
-keep class org.webkit.** { *; }

# ============================================
# Keep Enum Classes
# ============================================
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
