import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile type and storage
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Marketplace types and state
  type PublicOrder = {
    orderId : Text;
    title : Text;
    description : Text;
    budget : Nat;
    status : Text;
    createdAt : Int;
  };

  module PublicOrder {
    public func compareByCreatedAtAsc(order1 : PublicOrder, order2 : PublicOrder) : Order.Order {
      Int.compare(order1.createdAt, order2.createdAt);
    };

    public func compareByCreatedAtDesc(order1 : PublicOrder, order2 : PublicOrder) : Order.Order {
      Int.compare(order2.createdAt, order1.createdAt);
    };
  };

  let userPseudonyms = Map.empty<Principal, Text>();
  let ordersPseudonym = Map.empty<Text, (PublicOrder, Principal)>();
  var orderCounter = 0;

  let pseudonymPrefixes = ["Writer", "Lister", "Scholar", "Agent", "Broker"];

  public shared ({ caller }) func registerUser() : async Text {
    // Users and admins can register, but not guests
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };

    switch (userPseudonyms.get(caller)) {
      case (?pseudonym) { pseudonym };
      case (null) {
        let prefixIndex = caller.toText().size() % pseudonymPrefixes.size();
        let prefix = pseudonymPrefixes[prefixIndex];
        let number = (Time.now() % 9000).toNat() + 1000;
        let pseudonym = prefix # "_" # number.toText();
        userPseudonyms.add(caller, pseudonym);
        pseudonym;
      };
    };
  };

  public query ({ caller }) func getMyPseudonym() : async ?Text {
    // Any authenticated user can query their own pseudonym
    // No strict check needed - guests will simply get null
    userPseudonyms.get(caller);
  };

  func getPseudonymWithChecks(caller : Principal) : Text {
    switch (userPseudonyms.get(caller)) {
      case (?pseudonym) { pseudonym };
      case (null) { Runtime.trap("User not registered") };
    };
  };

  public shared ({ caller }) func createOrder(title : Text, description : Text, budget : Nat) : async Text {
    // Only authenticated users can create orders
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };

    ignore getPseudonymWithChecks(caller);
    orderCounter += 1;
    let orderId = "ORD-" # orderCounter.toText();

    let order : PublicOrder = {
      orderId;
      title;
      description;
      budget;
      status = "open";
      createdAt = Time.now();
    };

    ordersPseudonym.add(orderId, (order, caller));
    orderId;
  };

  func getOrderList() : [PublicOrder] {
    ordersPseudonym.entries().toArray().map(
      func((orderId, (order, lister))) {
        order;
      }
    );
  };

  public query ({ caller }) func getOrders() : async [PublicOrder] {
    // Public function - anyone including guests can view all orders
    getOrderList();
  };

  public query ({ caller }) func getMyOrders() : async [PublicOrder] {
    // Users can view their own orders
    // No strict permission check - if caller is guest/anonymous, they'll get empty list
    ordersPseudonym.entries().toArray().filter(
      func((orderId, (order, lister))) {
        lister == caller;
      }
    ).map(
      func((orderId, (order, lister))) {
        order;
      }
    );
  };

  public query ({ caller }) func getOrderById(orderId : Text) : async ?PublicOrder {
    // Public function - anyone including guests can view order details
    switch (ordersPseudonym.get(orderId)) {
      case (null) { null };
      case (?orderData) {
        ?orderData.0;
      };
    };
  };
};
